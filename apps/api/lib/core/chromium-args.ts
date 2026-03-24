/**
 * Based on https://github.com/Sparticuz/chromium/blob/01d6b688e84efc6ca8a03cb9dd9d9a60b9b0ccdd/source/index.ts#L136
 *
 * Returns a list of additional Chromium flags recommended for serverless environments.
 * The canonical list of flags can be found on https://peter.sh/experiments/chromium-command-line-switches/.
 */
export function getChromiumArgs(): string[] {
  /**
   * These are the default args in puppeteer.
   * https://github.com/puppeteer/puppeteer/blob/3a31070d054fa3cd8116ca31c578807ed8d6f987/packages/puppeteer-core/src/node/ChromeLauncher.ts#L185
   */
  const puppeteerFlags = [
    "--allow-pre-commit-input",
    "--disable-background-networking",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-breakpad",
    "--disable-client-side-phishing-detection",
    "--disable-component-extensions-with-background-pages",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-hang-monitor",
    "--disable-ipc-flooding-protection",
    "--disable-popup-blocking",
    "--disable-prompt-on-repost",
    "--disable-renderer-backgrounding",
    "--disable-sync",
    "--enable-automation",
    "--enable-blink-features=IdleDetection",
    "--export-tagged-pdf",
    "--force-color-profile=srgb",
    "--metrics-recording-only",
    "--no-first-run",
    "--password-store=basic",
    "--use-mock-keychain",
  ];
  const puppeteerDisableFeatures = [
    "Translate",
    "BackForwardCache",
    // AcceptCHFrame disabled because of crbug.com/1348106.
    "AcceptCHFrame",
    "MediaRouter",
    "OptimizationHints",
  ];
  const puppeteerEnableFeatures = ["NetworkServiceInProcess2"];

  const chromiumFlags = [
    "--disable-domain-reliability", // https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md#background-networking
    "--disable-print-preview", // https://source.chromium.org/search?q=lang:cpp+symbol:kDisablePrintPreview&ss=chromium
    "--disable-speech-api", // https://source.chromium.org/search?q=lang:cpp+symbol:kDisableSpeechAPI&ss=chromium
    "--disk-cache-size=33554432", // https://source.chromium.org/search?q=lang:cpp+symbol:kDiskCacheSize&ss=chromium
    "--mute-audio", // https://source.chromium.org/search?q=lang:cpp+symbol:kMuteAudio&ss=chromium
    "--no-default-browser-check", // https://source.chromium.org/search?q=lang:cpp+symbol:kNoDefaultBrowserCheck&ss=chromium
    "--no-pings", // https://source.chromium.org/search?q=lang:cpp+symbol:kNoPings&ss=chromium
    "--single-process", // Needs to be single-process to avoid `prctl(PR_SET_NO_NEW_PRIVS) failed` error
    "--font-render-hinting=none", // https://github.com/puppeteer/puppeteer/issues/2410#issuecomment-560573612
  ];
  const chromiumDisableFeatures = [
    "AudioServiceOutOfProcess",
    "IsolateOrigins",
    "site-per-process",
  ];
  const chromiumEnableFeatures = ["SharedArrayBuffer"];

  const graphicsFlags = [
    "--hide-scrollbars", // https://source.chromium.org/search?q=lang:cpp+symbol:kHideScrollbars&ss=chromium
    "--ignore-gpu-blocklist", // https://source.chromium.org/search?q=lang:cpp+symbol:kIgnoreGpuBlocklist&ss=chromium
    "--in-process-gpu", // https://source.chromium.org/search?q=lang:cpp+symbol:kInProcessGPU&ss=chromium
    "--window-size=1920,1080", // https://source.chromium.org/search?q=lang:cpp+symbol:kWindowSize&ss=chromium
  ];

  graphicsFlags.push("--disable-webgl");

  const insecureFlags = [
    "--allow-running-insecure-content", // https://source.chromium.org/search?q=lang:cpp+symbol:kAllowRunningInsecureContent&ss=chromium
    "--disable-setuid-sandbox", // https://source.chromium.org/search?q=lang:cpp+symbol:kDisableSetuidSandbox&ss=chromium
    "--disable-site-isolation-trials", // https://source.chromium.org/search?q=lang:cpp+symbol:kDisableSiteIsolation&ss=chromium
    "--disable-web-security", // https://source.chromium.org/search?q=lang:cpp+symbol:kDisableWebSecurity&ss=chromium
    "--no-sandbox", // https://source.chromium.org/search?q=lang:cpp+symbol:kNoSandbox&ss=chromium
    "--no-zygote", // https://source.chromium.org/search?q=lang:cpp+symbol:kNoZygote&ss=chromium
  ];

  const headlessFlags = ["--headless='shell'"];

  return [
    ...puppeteerFlags,
    ...chromiumFlags,
    `--disable-features=${[...puppeteerDisableFeatures, ...chromiumDisableFeatures].join(",")}`,
    `--enable-features=${[...puppeteerEnableFeatures, ...chromiumEnableFeatures].join(",")}`,
    ...graphicsFlags,
    ...insecureFlags,
    ...headlessFlags,
  ];
}
