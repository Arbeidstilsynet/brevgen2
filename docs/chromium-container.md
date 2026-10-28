# Chromium/Puppeteer Flags in Containers

Research date: 2026-10-13. Official docs inspected at Puppeteer 25.13.0; live pages may change.

## Answer

There are maintained references, but no single universal, up-to-date list of **extra container flags** in the sources reviewed. Start with Puppeteer's version-specific defaults and add only justified environment or rendering overrides. The [official Docker guide][docker] covers runtime requirements; [Chrome Flags for Tooling][catalog] is a general catalog, explicitly requiring choices per use case, not a Docker checklist.

## Source-Backed Guidance

- [`LaunchOptions`][launch] defines `args` as additional arguments and defaults `ignoreDefaultArgs` to `false`. It cautions against discarding defaults. [`defaultArgs()`][defaults] exposes the defaults for the installed version.
- The [version-pinned Puppeteer 25.13.0 launcher][launcher] already supplies `--disable-dev-shm-usage`, `--disable-background-networking`, `--disable-breakpad`, and `--force-color-profile=srgb`. Headless mode adds `--hide-scrollbars` and `--mute-audio`; `headless: true` selects `--headless=new`. Feature overrides are merged with defaults, not simply substituted wholesale.
- Prefer the `headless` launch option over copying a headless switch. [`LaunchOptions`][launch] distinguishes modern headless (`true`) from the separate old headless shell (`'shell'`); a system Chromium executable is not that shell. A custom `executablePath` is used at the caller's risk: Puppeteer guarantees compatibility only with its bundled browser.
- The [official image][docker] runs sandboxed and requires `SYS_ADMIN`. It also requires an init process (`--init` or an equivalent entrypoint) for child-process management. These are container runtime settings, not Chromium arguments. Dbus is usually unnecessary in headless mode despite possible warnings.
- [Sandbox guidance][sandbox] strongly discourages `--no-sandbox`, allowing it only when the content is absolutely trusted. Its legacy SUID instructions are explicitly mostly out-of-date. Non-root execution alone is not a sandbox guarantee; user namespaces and host security policy matter. See the documented AppArmor/user-namespace restrictions.
- [Read-only container guidance][readonly] requires writable profile, configuration, and cache locations. With writable `/tmp`, it recommends `XDG_CONFIG_HOME=/tmp/.chromium` and `XDG_CACHE_HOME=/tmp/.chromium`; Puppeteer's temporary profile also needs writable storage.
- The [troubleshooting Docker examples][troubleshooting] still include Node 14 and an Alpine example pinned to Puppeteer 13.5.0/Chromium 100. Useful historical examples are not a current flag checklist; prefer the dedicated Docker guide and version-pinned launcher.

## Local Evidence

- [apps/api/src/renderer/browser/chromium-args.ts](../apps/api/src/renderer/browser/chromium-args.ts) copies a Sparticuz AWS Lambda/serverless list, including old Puppeteer defaults, security exceptions, and process/rendering overrides. That provenance does not establish a need for every flag in this Debian container.
- [apps/api/Dockerfile](../apps/api/Dockerfile) uses Node 26 on Debian trixie, pins system Chromium `155.0.8059.39-1~deb13u1`, sets both XDG paths under `/tmp`, and has no `USER` instruction. This does not describe the deployed identity: the operator reports that NAIS automatically runs the container as non-root and only `/tmp` is writable by default. [compose.yaml](../compose.yaml) also makes the API filesystem read-only with writable `/tmp`, but does not reproduce NAIS's non-root/security policy.
- The operator describes content as internal and trusted. [get-html.ts](../apps/api/src/renderer/get-html.ts) sanitizes Markdown-generated HTML, restricts image URL schemes to `data`, and interpolates the document title afterward. [generate-output.ts](../apps/api/src/renderer/generate-output.ts) adds supplied CSS separately. Sanitizing Markdown is therefore not sanitizing every browser input, nor protection against vulnerabilities in Chromium's rendering of otherwise permitted content. Internal access, sanitization, container isolation, and the browser sandbox address different layers of risk.
- Earlier local experiment, recorded before this note: launching with `--single-process` exited 132; removing **only that flag** allowed launch and all 30 integration tests, including eight visual comparisons, to pass. The user also reports all CI integrations passing. These results were not rerun for this documentation task, do not validate removing other flags, and do not establish that an upstream change caused the crash.

## Proposed Follow-Up, Not Implemented

1. Retain Puppeteer's defaults and gradually reduce the additional list to documented environment/behavior overrides. Inspect `defaultArgs()` for the actual installed version rather than maintaining a second copied baseline.
2. Treat `--disable-web-security`, `--allow-running-insecure-content`, and site-isolation disables as security exceptions requiring justification, not normal Docker requirements. The [tooling catalog][catalog] describes behavior-changing switches and links Chromium's site-isolation documentation; the container guide does not prescribe them.
3. Do not assume `--single-process`, `--no-zygote`, or `--in-process-gpu` are required by containers. Keep the demonstrated `--single-process` removal distinct from any broader cleanup; other process changes require their own validation.
4. Treat sandbox enablement separately from flag cleanup. NAIS already provides non-root execution, but browser sandbox availability still depends on the platform's namespace and security policies. Do not simply remove `--no-sandbox` based on local Compose results, or add broad `SYS_ADMIN` privileges just to match the official image example. Evaluate platform-supported, least-privilege options; retaining an unsandboxed browser is an explicit risk tradeoff, not something internal access or HTML sanitization makes equivalent to sandboxing.
5. Preserve PDF-specific behavior, including tagging, fonts, color profile, and rendering overrides, until launch/PDF/visual checks validate each proposed change and deployed writable-path, sandbox, and process-management constraints are checked.

Only this research note was added; no code or runtime configuration changes were made.

## Primary Sources

[docker]: https://pptr.dev/guides/docker
[launch]: https://pptr.dev/api/puppeteer.launchoptions
[defaults]: https://pptr.dev/api/puppeteer.puppeteernode.defaultargs
[launcher]: https://github.com/puppeteer/puppeteer/blob/puppeteer-v25.13.0/packages/puppeteer-core/src/node/ChromeLauncher.ts
[catalog]: https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md
[troubleshooting]: https://pptr.dev/troubleshooting
[sandbox]: https://pptr.dev/troubleshooting#setting-up-chrome-linux-sandbox
[readonly]: https://pptr.dev/troubleshooting#running-in-read-only-containers

The pinned launcher was verified via its [raw source](https://raw.githubusercontent.com/puppeteer/puppeteer/puppeteer-v25.13.0/packages/puppeteer-core/src/node/ChromeLauncher.ts); the GitHub HTML view returned HTTP 503 during research.
