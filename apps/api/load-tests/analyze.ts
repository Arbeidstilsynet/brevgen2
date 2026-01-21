import fs from "node:fs";
import { ResultData } from "./types";

// USAGE
// tsx load-tests/analyze.ts ./results/load-test-results.json

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a results file path");
  process.exit(1);
}

const resultsFilePath = args[0];

if (!fs.existsSync(resultsFilePath)) {
  console.error(`File not found: ${resultsFilePath}`);
  process.exit(1);
}

try {
  const resultsData = JSON.parse(fs.readFileSync(resultsFilePath, "utf8")) as ResultData;
  const { config, result } = resultsData;

  console.log("=== Load Test Analysis ===");
  console.log(`\nTest configuration:`);
  console.log(`- API URL: ${config.apiUrl}`);
  console.log(`- Parallel Requests: ${config.parallelRequests}`);
  console.log(`- Batch Count: ${config.batchCount}`);
  console.log(`- Batch Delay: ${config.batchDelayMs}ms`);
  console.log(`- Total Requests: ${config.parallelRequests * config.batchCount}`);

  console.log(`\nOverall results:`);
  console.log(`- Total time: ${(result.totalTimeMs / 1000).toFixed(2)}s`);
  console.log(
    `- Successful requests: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%)`,
  );
  console.log(
    `- Failed requests: ${result.failedRequests} (${((result.failedRequests / result.totalRequests) * 100).toFixed(1)}%)`,
  );
  console.log(`- Average request time: ${result.averageRequestTimeMs.toFixed(2)}ms`);

  console.log(`\nPerformance by batch:`);
  result.batches.forEach((batch, index) => {
    console.log(`\nBatch #${index + 1}:`);
    console.log(
      `- Success rate: ${batch.successCount}/${batch.requests.length} (${((batch.successCount / batch.requests.length) * 100).toFixed(1)}%)`,
    );
    console.log(`- Total batch time: ${(batch.totalTimeMs / 1000).toFixed(2)}s`);

    const batchTimes = batch.requests.map((r) => r.timeMs);
    const avgTime = batchTimes.reduce((sum, t) => sum + t, 0) / batchTimes.length;
    const minTime = Math.min(...batchTimes);
    const maxTime = Math.max(...batchTimes);

    console.log(
      `- Min/Avg/Max request time: ${minTime}ms / ${avgTime.toFixed(2)}ms / ${maxTime}ms`,
    );

    if (batch.failureCount > 0) {
      console.log(`- Failures:`);
      batch.requests
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.requestId}: ${r.status} (${r.error})`);
        });
    }
  });

  // Distribution of response times
  const allTimes = result.batches.flatMap((batch) => batch.requests.map((r) => r.timeMs));
  allTimes.sort((a, b) => a - b);

  const p50 = allTimes[Math.floor(allTimes.length * 0.5)];
  const p90 = allTimes[Math.floor(allTimes.length * 0.9)];
  const p95 = allTimes[Math.floor(allTimes.length * 0.95)];
  const p99 = allTimes[Math.floor(allTimes.length * 0.99)];

  console.log(`\nResponse time percentiles:`);
  console.log(`- P50: ${p50}ms`);
  console.log(`- P90: ${p90}ms`);
  console.log(`- P95: ${p95}ms`);
  console.log(`- P99: ${p99}ms`);
} catch (error) {
  console.error("Failed to analyze results:", error);
  process.exit(1);
}
