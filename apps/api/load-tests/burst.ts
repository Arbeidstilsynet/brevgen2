import { createPayload, profileForRequest, profileNames, type LoadTestProfile } from "./profiles";

/**
 * PDF Generator Admission Control Burst Tool
 *
 * This script fires a single wave of simultaneous requests to exercise the document
 * generation scheduler's admission control. It is deliberately different from
 * `run.ts`: that script ramps the arrival *rate* and requires zero failures, while
 * this one drives *concurrency* to provoke controlled overload and reports which
 * admission outcome each request received.
 *
 * Controlled `503` overload responses are expected here and are not treated as
 * failures. Any other error status is, and fails the run.
 *
 * USAGE:
 * tsx load-tests/burst.ts [options]
 *
 * OPTIONS:
 * --apiUrl=<url>           The API endpoint to test (default: http://localhost:4000/genererbrev)
 * --count=<n>              Number of simultaneous requests (default: 200)
 * --profile=<name>         Force a single profile; omit to use the weighted profile cycle.
 *                          One of: small-blank, typical-default, typical-direktorat, heavy-default
 * --abandonCount=<n>       How many of the requests disconnect instead of waiting (default: 0)
 * --abandonAfterMs=<ms>    How long an abandoning caller waits before disconnecting (default: 150)
 * --timeoutMs=<ms>         Request timeout in milliseconds (default: 120000)
 * --jwt=<token>            Optional JWT bearer token for authentication
 *
 * ENVIRONMENT VARIABLES:
 * The same options can be provided as environment variables:
 * API_URL, BURST_COUNT, BURST_PROFILE, BURST_ABANDON_COUNT, BURST_ABANDON_AFTER_MS, TIMEOUT_MS, JWT
 *
 * EXAMPLES:
 * Fill the queue and provoke immediate `queue-full` rejections:
 *   tsx load-tests/burst.ts --count=200 --profile=small-blank
 *
 * Provoke `queue-deadline` rejections. Whether queued jobs actually exceed the deadline
 * depends on render throughput, so with the default 30s deadline this is marginal even
 * with heavy documents. Lower `GENERATION_MAX_QUEUE_WAIT_MS` on the server (e.g. 5000)
 * to reach the path deterministically:
 *   tsx load-tests/burst.ts --count=200 --profile=heavy-default
 *
 * Exercise the caller-disconnect path:
 *   tsx load-tests/burst.ts --count=60 --abandonCount=30 --profile=small-blank
 *
 * Against a deployed API:
 *   tsx load-tests/burst.ts --apiUrl=https://api.example.com/genererbrev --jwt=myjwttoken
 */

type BurstOutcome = "generated" | "queue-full" | "queue-deadline" | "disconnected" | "unexpected";

interface BurstRequestResult {
  outcome: BurstOutcome;
  status: number;
  retryAfter: string | null;
  /** Milliseconds from the start of the burst until the response was received */
  completedAtMs: number;
  detail?: string;
}

interface BurstConfig {
  apiUrl: string;
  count: number;
  profile?: LoadTestProfile;
  abandonCount: number;
  abandonAfterMs: number;
  timeoutMs: number;
  jwt?: string;
}

function classify(status: number, body: string): BurstOutcome {
  if (status === 200) {
    return "generated";
  }
  if (status === 503 && body.includes("queue is full")) {
    return "queue-full";
  }
  if (status === 503 && body.includes("wait time exceeded")) {
    return "queue-deadline";
  }
  return "unexpected";
}

async function sendRequest(
  config: BurstConfig,
  requestNumber: number,
  abandon: boolean,
  startedAtMs: number,
): Promise<BurstRequestResult> {
  const profile = config.profile ?? profileForRequest(requestNumber);
  const requestId = `burst-${requestNumber}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const disconnect = abandon
    ? setTimeout(() => controller.abort(), config.abandonAfterMs)
    : undefined;

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(config.jwt ? { authorization: `Bearer ${config.jwt}` } : {}),
      },
      body: JSON.stringify(createPayload(profile, requestId)),
      signal: controller.signal,
    });
    const body = response.status === 200 ? "" : await response.text();

    return {
      outcome: classify(response.status, body),
      status: response.status,
      retryAfter: response.headers.get("retry-after"),
      completedAtMs: Date.now() - startedAtMs,
      detail: body === "" ? undefined : body,
    };
  } catch (error) {
    // An abandoning caller is expected to abort; anything else is a real failure.
    const aborted = error instanceof Error && error.name === "AbortError";

    return {
      outcome: aborted && abandon ? "disconnected" : "unexpected",
      status: 0,
      retryAfter: null,
      completedAtMs: Date.now() - startedAtMs,
      detail: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
    if (disconnect) {
      clearTimeout(disconnect);
    }
  }
}

function reportOutcome(results: BurstRequestResult[], outcome: BurstOutcome, label: string) {
  const matching = results.filter((result) => result.outcome === outcome);
  if (matching.length === 0) {
    return;
  }

  const first = matching[0].completedAtMs;
  const last = matching.at(-1)!.completedAtMs;
  const retryAfter = [...new Set(matching.map((result) => result.retryAfter).filter(Boolean))];

  console.log(
    `${label}: ${matching.length}` +
      ` (first after ${(first / 1000).toFixed(1)}s, last after ${(last / 1000).toFixed(1)}s` +
      (retryAfter.length > 0 ? `, Retry-After: ${retryAfter.join(", ")}` : "") +
      ")",
  );
}

async function main() {
  const argMap: Record<string, string> = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      argMap[key] = value;
    }
  });

  const profile = argMap.profile ?? process.env.BURST_PROFILE;
  if (profile !== undefined && !profileNames.includes(profile as LoadTestProfile)) {
    console.error(`Unknown profile '${profile}'. Expected one of: ${profileNames.join(", ")}`);
    process.exit(1);
  }

  const config: BurstConfig = {
    apiUrl: argMap.apiUrl ?? process.env.API_URL ?? "http://localhost:4000/genererbrev",
    count: Number.parseInt(argMap.count ?? process.env.BURST_COUNT ?? "200"),
    profile: profile as LoadTestProfile | undefined,
    abandonCount: Number.parseInt(argMap.abandonCount ?? process.env.BURST_ABANDON_COUNT ?? "0"),
    abandonAfterMs: Number.parseInt(
      argMap.abandonAfterMs ?? process.env.BURST_ABANDON_AFTER_MS ?? "150",
    ),
    timeoutMs: Number.parseInt(argMap.timeoutMs ?? process.env.TIMEOUT_MS ?? "120000"),
    jwt: argMap.jwt ?? process.env.JWT,
  };

  console.log("Burst Configuration:");
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Simultaneous requests: ${config.count}`);
  console.log(`Profile: ${config.profile ?? "weighted cycle"}`);
  console.log(
    `Abandoning callers: ${config.abandonCount}` +
      (config.abandonCount > 0 ? ` (disconnecting after ${config.abandonAfterMs}ms)` : ""),
  );
  console.log(`JWT Token: ${config.jwt ? "Provided" : "Not Provided"}`);
  console.log("\nStarting burst...");

  const startedAtMs = Date.now();
  const results = await Promise.all(
    Array.from({ length: config.count }, (_unused, requestNumber) =>
      sendRequest(config, requestNumber, requestNumber < config.abandonCount, startedAtMs),
    ),
  );
  const totalTimeMs = Date.now() - startedAtMs;

  console.log(`\nBurst completed in ${(totalTimeMs / 1000).toFixed(1)}s`);
  reportOutcome(results, "generated", "Generated");
  reportOutcome(results, "queue-full", "Rejected, queue full");
  reportOutcome(results, "queue-deadline", "Rejected, queue deadline");
  reportOutcome(results, "disconnected", "Disconnected while queued");

  const unexpected = results.filter((result) => result.outcome === "unexpected");
  if (unexpected.length > 0) {
    console.error(`\n❌ ${unexpected.length} unexpected responses`);
    for (const detail of new Set(
      unexpected.map((result) => `${result.status}: ${result.detail}`),
    )) {
      console.error(`  ${detail}`);
    }
    process.exit(1);
  }

  console.log("\n✅ Every request was either generated or rejected in a controlled way");
  process.exit(0);
}

await main();
