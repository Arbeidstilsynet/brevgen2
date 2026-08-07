import type { Browser } from "puppeteer-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { RendererProgressStage } from "../rendererHealth";
import { OperationTimeoutError } from "./helpers";
import { useBrowserWithRetry } from "./get-browser";

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

beforeEach(() => {
  browserMocks.close.mockResolvedValue();
  browserMocks.launch.mockResolvedValue(createBrowser());
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe.sequential("useBrowserWithRetry", () => {
  test("recycles the browser and stops retrying at the complete generation deadline", async () => {
    vi.useFakeTimers();
    const progress = vi.fn<(stage: RendererProgressStage) => void>();
    const result = useBrowserWithRetry(async () => await new Promise<never>(() => undefined), {
      progress,
      timeoutMs: 50,
    });
    const error = result.catch((caught: unknown) => caught);

    await vi.advanceTimersByTimeAsync(50);

    await expect(error).resolves.toEqual(new OperationTimeoutError("Generating document", 50));
    expect(progress).toHaveBeenCalledWith("acquiring-browser");
    expect(progress).toHaveBeenCalledWith("recycling-browser");
    expect(progress).not.toHaveBeenCalledWith("retrying");
    expect(browserMocks.close).toHaveBeenCalledOnce();
  });

  test("recycles and retries an ordinary browser error within the total deadline", async () => {
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
  });
});
