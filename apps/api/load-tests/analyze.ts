import fs from "node:fs";
import { profileNames } from "./profiles";
import type { RequestResult, ResultData } from "./types";

const [resultsFilePath, format = "text"] = process.argv.slice(2);

if (!resultsFilePath) {
  console.error("Please provide a results file path");
  process.exit(1);
}

if (!fs.existsSync(resultsFilePath)) {
  console.error(`File not found: ${resultsFilePath}`);
  process.exit(1);
}

if (!["text", "markdown"].includes(format)) {
  console.error(`Unsupported output format: ${format}`);
  process.exit(1);
}

const resultsData = JSON.parse(fs.readFileSync(resultsFilePath, "utf8")) as ResultData;
const { config, result } = resultsData;

interface LatencySummary {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  average: number;
}

function percentile(values: number[], percentileValue: number): number {
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[
    Math.min(Math.ceil((percentileValue / 100) * sorted.length) - 1, sorted.length - 1)
  ];
}

/** Latency statistics for the given requests, or `undefined` when there were none. */
function latencySummary(requests: RequestResult[]): LatencySummary | undefined {
  if (requests.length === 0) {
    return undefined;
  }

  const values = requests.map((request) => request.timeMs);
  return {
    p50: percentile(values, 50),
    p90: percentile(values, 90),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
  };
}

function formatMs(value: number | undefined): string {
  return value === undefined ? "-" : `${Math.round(value)}ms`;
}

function profileRows() {
  return profileNames.map((profile) => {
    const requests = result.requests.filter((request) => request.profile === profile);
    const successful = requests.filter((request) => request.success).length;
    return {
      profile,
      total: requests.length,
      successful,
      failed: requests.length - successful,
      latency: latencySummary(requests),
    };
  });
}

function errorSummary() {
  const errors = new Map<string, RequestResult[]>();
  for (const request of result.requests.filter((entry) => !entry.success)) {
    const key = request.status === 0 ? "network-or-timeout" : `HTTP ${request.status}`;
    errors.set(key, [...(errors.get(key) ?? []), request]);
  }
  return [...errors.entries()].map(([kind, requests]) => ({
    kind,
    count: requests.length,
    samples: requests.slice(0, 3),
  }));
}

const overallLatency = latencySummary(result.requests);
const rows = profileRows();
const errors = errorSummary();
const actualDurationSeconds = result.totalTimeMs / 1000;
const actualRequestsPerSecond =
  actualDurationSeconds > 0 ? result.totalRequests / actualDurationSeconds : 0;

if (format === "markdown") {
  console.log("## Load test results");
  console.log("");
  console.log(
    `**${result.successfulRequests}/${result.totalRequests} successful** in ${actualDurationSeconds.toFixed(1)}s (${actualRequestsPerSecond.toFixed(2)} requests/s).`,
  );
  console.log("");
  console.log("| Profile | Requests | Successful | Failed | P50 | P95 | P99 |");
  console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const row of rows) {
    console.log(
      `| ${row.profile} | ${row.total} | ${row.successful} | ${row.failed} | ${formatMs(row.latency?.p50)} | ${formatMs(row.latency?.p95)} | ${formatMs(row.latency?.p99)} |`,
    );
  }
  console.log("");
  console.log(
    `Overall latency: P50 **${formatMs(overallLatency?.p50)}**, P90 **${formatMs(overallLatency?.p90)}**, P95 **${formatMs(overallLatency?.p95)}**, P99 **${formatMs(overallLatency?.p99)}**, average **${formatMs(overallLatency?.average)}**.`,
  );
  if (errors.length > 0) {
    console.log("");
    console.log("### Failures");
    for (const error of errors) {
      console.log(`- **${error.kind}: ${error.count}**`);
      for (const sample of error.samples) {
        console.log(
          `  - ${sample.requestId} (${sample.profile}, ${sample.timeMs}ms): ${sample.error ?? "No error detail"}`,
        );
      }
    }
  }
} else {
  console.log("=== Load Test Analysis ===");
  console.log(`API URL: ${config.apiUrl}`);
  console.log(
    `Arrival rate: ${config.rampStartRequestsPerSecond} to ${config.peakRequestsPerSecond} requests/s over ${config.rampDurationMs}ms; sustained for ${config.sustainDurationMs}ms`,
  );
  console.log(
    `Results: ${result.successfulRequests}/${result.totalRequests} successful in ${actualDurationSeconds.toFixed(1)}s (${actualRequestsPerSecond.toFixed(2)} requests/s)`,
  );
  console.log(
    `Latency: P50 ${formatMs(overallLatency?.p50)}, P90 ${formatMs(overallLatency?.p90)}, P95 ${formatMs(overallLatency?.p95)}, P99 ${formatMs(overallLatency?.p99)}, average ${formatMs(overallLatency?.average)}`,
  );
  console.log("\nBy profile:");
  for (const row of rows) {
    console.log(
      `- ${row.profile}: ${row.successful}/${row.total} successful, P50 ${formatMs(row.latency?.p50)}, P95 ${formatMs(row.latency?.p95)}, P99 ${formatMs(row.latency?.p99)}`,
    );
  }
  if (errors.length > 0) {
    console.log("\nFailures:");
    for (const error of errors) {
      console.log(`- ${error.kind}: ${error.count}`);
      for (const sample of error.samples) {
        console.log(
          `  - ${sample.requestId} (${sample.profile}, ${sample.timeMs}ms): ${sample.error ?? "No error detail"}`,
        );
      }
    }
  }
}
