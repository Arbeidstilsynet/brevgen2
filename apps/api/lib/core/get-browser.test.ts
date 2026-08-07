import type { Browser } from "puppeteer-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { RendererProgressStage } from "../rendererHealth";

const browserMocks = vi.hoisted(() => ({
  close: vi.fn<() => Promise<void>>(),
  launch: vi.fn<() => Promise<Browser>>(),
}));

vi.mock("./puppeteer-loader", () => ({
  loadPuppeteer: async () => ({ launch: browserMocks.launch }),
}));

function createBrowser(): Browser {
  const browser: Browser = Object.create(null);
  browser.close = browserMocks.close;
  return browser;
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
  browserMocks.close.mockResolvedValue();
  browserMocks.launch.mockImplementation(async () => createBrowser());
});

afterEach(() => {
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
});
