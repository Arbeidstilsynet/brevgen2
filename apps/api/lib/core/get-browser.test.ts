import type { ChildProcess } from "node:child_process";
import type { Browser } from "puppeteer-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { RendererProgressStage } from "../rendererHealth";

const browserMocks = vi.hoisted(() => ({
  close: vi.fn<() => Promise<void>>(),
  kill: vi.fn<(signal?: number | NodeJS.Signals) => boolean>(),
  launch: vi.fn<() => Promise<Browser>>(),
  process: vi.fn<Browser["process"]>(),
}));

vi.mock("./puppeteer-loader", () => ({
  loadPuppeteer: async () => ({ launch: browserMocks.launch }),
}));

function createBrowser(): Browser {
  const browser: Browser = Object.create(null);
  browser.close = browserMocks.close;
  browser.process = browserMocks.process;
  return browser;
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

/**
 * The browser pool is module-level state, so each test gets a fresh module registry rather than
 * inheriting the previous test's browser, page count, and recycle flags.
 */
async function importUseBrowserWithRetry() {
  vi.resetModules();
  const { useBrowserWithRetry } = await import("./get-browser");
  return useBrowserWithRetry;
}

beforeEach(() => {
  delete process.env.TESTCONTAINERS;
  browserMocks.close.mockResolvedValue();
  browserMocks.kill.mockReturnValue(true);
  browserMocks.launch.mockImplementation(async () => createBrowser());
  browserMocks.process.mockReturnValue(null);
});

afterEach(() => {
  delete process.env.TESTCONTAINERS;
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("useBrowserWithRetry", () => {
  test("stops retrying at the complete generation deadline without recycling a healthy browser", async () => {
    vi.useFakeTimers();
    const useBrowserWithRetry = await importUseBrowserWithRetry();
    const progress = vi.fn<(stage: RendererProgressStage) => void>();
    const result = useBrowserWithRetry(async () => await new Promise<never>(() => undefined), {
      progress,
      timeoutMs: 50,
    });
    const error = result.catch((caught: unknown) => caught);

    await vi.advanceTimersByTimeAsync(50);

    await expect(error).resolves.toMatchObject({
      name: "GenerationDeadlineError",
      message: "Generating document timed out after 50ms",
    });
    expect(progress).toHaveBeenCalledWith("acquiring-browser");
    expect(progress).not.toHaveBeenCalledWith("retrying");
    expect(browserMocks.close).not.toHaveBeenCalled();
  });

  test("keeps serving later requests from the same browser after a deadline timeout", async () => {
    vi.useFakeTimers();
    const useBrowserWithRetry = await importUseBrowserWithRetry();
    const timedOut = useBrowserWithRetry(async () => await new Promise<never>(() => undefined), {
      timeoutMs: 50,
    }).catch((caught: unknown) => caught);

    await vi.advanceTimersByTimeAsync(50);
    await timedOut;

    await expect(useBrowserWithRetry(async () => "rendered", { timeoutMs: 1_000 })).resolves.toBe(
      "rendered",
    );
    expect(browserMocks.launch).toHaveBeenCalledOnce();
    expect(browserMocks.close).not.toHaveBeenCalled();
  });

  test("recycles and retries an ordinary browser error within the total deadline", async () => {
    const useBrowserWithRetry = await importUseBrowserWithRetry();
    const progress = vi.fn<(stage: RendererProgressStage) => void>();
    const render = vi
      .fn<(browser: Browser) => Promise<string>>()
      .mockRejectedValueOnce(new Error("Target closed"))
      .mockResolvedValueOnce("rendered");

    await expect(useBrowserWithRetry(render, { progress, timeoutMs: 1_000 })).resolves.toBe(
      "rendered",
    );

    expect(render).toHaveBeenCalledTimes(2);
    expect(browserMocks.launch).toHaveBeenCalledTimes(2);
    expect(browserMocks.close).toHaveBeenCalledOnce();
    expect(progress).toHaveBeenCalledWith("retrying");
    expect(progress).toHaveBeenCalledWith("recycling-browser");
  });

  test("waits for every active user before recycling and blocks new browser acquisitions", async () => {
    const useBrowserWithRetry = await importUseBrowserWithRetry();
    const activeRender = createDeferred<void>();
    const activeRenderStarted = createDeferred<void>();
    const firstResult = useBrowserWithRetry(async () => {
      activeRenderStarted.resolve();
      await activeRender.promise;
      return "first";
    });
    await activeRenderStarted.promise;

    const failingRender = vi
      .fn<(browser: Browser) => Promise<string>>()
      .mockRejectedValueOnce(new Error("Target closed"))
      .mockResolvedValueOnce("second");
    const progress = vi.fn<(stage: RendererProgressStage) => void>();
    const secondResult = useBrowserWithRetry(failingRender, { progress, timeoutMs: 1_000 });
    await vi.waitFor(() => expect(progress).toHaveBeenCalledWith("recycling-browser"));

    const waitingRender = vi.fn<() => Promise<string>>(async () => "third");
    const thirdResult = useBrowserWithRetry(waitingRender, { timeoutMs: 1_000 });
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(browserMocks.close).not.toHaveBeenCalled();
    expect(waitingRender).not.toHaveBeenCalled();

    activeRender.resolve();

    await expect(firstResult).resolves.toBe("first");
    await expect(secondResult).resolves.toBe("second");
    await expect(thirdResult).resolves.toBe("third");
    expect(browserMocks.close).toHaveBeenCalledOnce();
    expect(browserMocks.launch).toHaveBeenCalledTimes(2);
  });

  test("recycles at the page cap only after the current browser is released", async () => {
    process.env.TESTCONTAINERS = "true";
    const useBrowserWithRetry = await importUseBrowserWithRetry();
    const activeRender = createDeferred<void>();
    const activeRenderStarted = createDeferred<void>();
    let firstBrowser: Browser | undefined;
    const firstResult = useBrowserWithRetry(async (browser) => {
      firstBrowser = browser;
      activeRenderStarted.resolve();
      await activeRender.promise;
      return "first";
    });
    await activeRenderStarted.promise;

    let secondBrowser: Browser | undefined;
    let closeCallsWhenSecondRenderStarted: number | undefined;
    const secondRender = vi.fn<(browser: Browser) => Promise<string>>(async (browser) => {
      secondBrowser = browser;
      closeCallsWhenSecondRenderStarted = browserMocks.close.mock.calls.length;
      return "second";
    });
    const progress = vi.fn<(stage: RendererProgressStage) => void>();
    const secondResult = useBrowserWithRetry(secondRender, { progress, timeoutMs: 1_000 });
    await vi.waitFor(() => expect(progress).toHaveBeenCalledWith("acquiring-browser"));
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(secondRender).not.toHaveBeenCalled();
    expect(browserMocks.close).not.toHaveBeenCalled();

    activeRender.resolve();

    await expect(firstResult).resolves.toBe("first");
    await expect(secondResult).resolves.toBe("second");
    expect(firstBrowser).toBeDefined();
    expect(secondBrowser).toBeDefined();
    expect(secondBrowser).not.toBe(firstBrowser);
    expect(closeCallsWhenSecondRenderStarted).toBe(1);
    expect(browserMocks.close).toHaveBeenCalledTimes(2);
    expect(browserMocks.launch).toHaveBeenCalledTimes(2);
  });

  test("coalesces simultaneous browser failures into one recycle", async () => {
    const useBrowserWithRetry = await importUseBrowserWithRetry();
    const failAttempts = createDeferred<void>();
    const firstAttemptStarted = createDeferred<void>();
    const secondAttemptStarted = createDeferred<void>();
    let firstAttemptBrowser: Browser | undefined;
    let secondAttemptBrowser: Browser | undefined;
    const firstRender = vi
      .fn<(browser: Browser) => Promise<string>>()
      .mockImplementationOnce(async (browser) => {
        firstAttemptBrowser = browser;
        firstAttemptStarted.resolve();
        await failAttempts.promise;
        throw new Error("Target closed");
      })
      .mockResolvedValueOnce("first");
    const secondRender = vi
      .fn<(browser: Browser) => Promise<string>>()
      .mockImplementationOnce(async (browser) => {
        secondAttemptBrowser = browser;
        secondAttemptStarted.resolve();
        await failAttempts.promise;
        throw new Error("Target closed");
      })
      .mockResolvedValueOnce("second");

    const firstResult = useBrowserWithRetry(firstRender, { timeoutMs: 1_000 });
    const secondResult = useBrowserWithRetry(secondRender, { timeoutMs: 1_000 });
    await Promise.all([firstAttemptStarted.promise, secondAttemptStarted.promise]);
    failAttempts.resolve();

    await expect(Promise.all([firstResult, secondResult])).resolves.toEqual(["first", "second"]);
    expect(firstAttemptBrowser).toBeDefined();
    expect(secondAttemptBrowser).toBe(firstAttemptBrowser);
    expect(browserMocks.close).toHaveBeenCalledOnce();
    expect(browserMocks.launch).toHaveBeenCalledTimes(2);
  });

  test("recovers from browser launch failure on the next attempt", async () => {
    browserMocks.launch.mockRejectedValueOnce(new Error("launch failed"));
    const useBrowserWithRetry = await importUseBrowserWithRetry();

    await expect(useBrowserWithRetry(async () => "rendered", { timeoutMs: 1_000 })).resolves.toBe(
      "rendered",
    );

    expect(browserMocks.launch).toHaveBeenCalledTimes(2);
    expect(browserMocks.close).not.toHaveBeenCalled();
  });

  test("force-kills a browser whose close operation times out and then recovers", async () => {
    vi.useFakeTimers();
    browserMocks.close.mockImplementationOnce(async () => await new Promise(() => undefined));
    const childProcess: ChildProcess = Object.create(null);
    childProcess.kill = browserMocks.kill;
    browserMocks.process.mockReturnValue(childProcess);
    const useBrowserWithRetry = await importUseBrowserWithRetry();
    const render = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("Target closed"))
      .mockResolvedValueOnce("rendered");
    const result = useBrowserWithRetry(render, { timeoutMs: 10_000 });

    await vi.advanceTimersByTimeAsync(5_000);

    await expect(result).resolves.toBe("rendered");
    expect(browserMocks.kill).toHaveBeenCalledExactlyOnceWith("SIGKILL");
    expect(browserMocks.launch).toHaveBeenCalledTimes(2);
  });

  test("honors the generation deadline while Chromium is launching", async () => {
    vi.useFakeTimers();
    browserMocks.launch.mockImplementationOnce(async () => await new Promise(() => undefined));
    const useBrowserWithRetry = await importUseBrowserWithRetry();
    const render = vi.fn<() => Promise<string>>(async () => "rendered");
    const result = useBrowserWithRetry(render, { timeoutMs: 50 }).catch(
      (caught: unknown) => caught,
    );

    await vi.advanceTimersByTimeAsync(50);

    await expect(result).resolves.toMatchObject({ name: "GenerationDeadlineError" });
    expect(browserMocks.launch).toHaveBeenCalledOnce();
    expect(render).not.toHaveBeenCalled();
    expect(browserMocks.close).not.toHaveBeenCalled();
  });

  test("honors the generation deadline while waiting for browser recycling", async () => {
    vi.useFakeTimers();
    const closeBrowser = createDeferred<void>();
    browserMocks.close.mockImplementationOnce(async () => await closeBrowser.promise);
    const useBrowserWithRetry = await importUseBrowserWithRetry();
    const render = vi.fn<() => Promise<string>>(async () => {
      throw new Error("Target closed");
    });
    const result = useBrowserWithRetry(render, { timeoutMs: 50 }).catch(
      (caught: unknown) => caught,
    );

    await vi.advanceTimersByTimeAsync(50);

    await expect(result).resolves.toMatchObject({ name: "GenerationDeadlineError" });
    expect(render).toHaveBeenCalledOnce();
    expect(browserMocks.close).toHaveBeenCalledOnce();
    expect(browserMocks.launch).toHaveBeenCalledOnce();

    closeBrowser.resolve();
    await vi.advanceTimersByTimeAsync(0);
  });
});
