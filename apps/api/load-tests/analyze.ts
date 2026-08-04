import fs from "node:fs";
import type { LoadTestProfile, RequestResult, ResultData } from "./types";

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
const profiles: LoadTestProfile[] = [
  "small-blank",
  "typical-default",
  "typical-direktorat",
  "heavy-default",
];

function percentile(values: number[], percentileValue: number): number {
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[
    Math.min(Math.ceil((percentileValue / 100) * sorted.length) - 1, sorted.length - 1)
  ];
}

function latencySummary(requests: RequestResult[]) {
  const values = requests.map((request) => request.timeMs);
  return {
    p50: percentile(values, 50),
    p90: percentile(values, 90),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
  };
}

function profileRows() {
  return profiles.map((profile) => {
    const requests = result.requests.filter((request) => request.profile === profile);
    const successful = requests.filter((request) => request.success).length;
    const latency = latencySummary(requests);
    return {
      profile,
      total: requests.length,
      successful,
      failed: requests.length - successful,
      p50: latency.p50,
      p90: latency.p90,
      p95: latency.p95,
      p99: latency.p99,
      average: latency.average,
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
const actualRequestsPerSecond = result.totalRequests / actualDurationSeconds;

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
      `| ${row.profile} | ${row.total} | ${row.successful} | ${row.failed} | ${row.p50}ms | ${row.p95}ms | ${row.p99}ms |`,
    );
  }
  console.log("");
  console.log(
    `Overall latency: P50 **${overallLatency.p50}ms**, P90 **${overallLatency.p90}ms**, P95 **${overallLatency.p95}ms**, P99 **${overallLatency.p99}ms**, average **${overallLatency.average.toFixed(0)}ms**.`,
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
    `Latency: P50 ${overallLatency.p50}ms, P90 ${overallLatency.p90}ms, P95 ${overallLatency.p95}ms, P99 ${overallLatency.p99}ms, average ${overallLatency.average.toFixed(0)}ms`,
  );
  console.log("\nBy profile:");
  for (const row of rows) {
    console.log(
      `- ${row.profile}: ${row.successful}/${row.total} successful, P50 ${row.p50}ms, P95 ${row.p95}ms, P99 ${row.p99}ms`,
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
