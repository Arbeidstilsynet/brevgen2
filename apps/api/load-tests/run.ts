import fs from "node:fs";
import path from "node:path";
import { runLoadTest } from "./requests";
import { LoadTestConfig, ResultData } from "./types";
import { deleteOldPdfs } from "./utils";

/**
 * PDF Generator Load Testing Tool
 *
 * This script executes load tests against the PDF generator API by sending
 * configurable numbers of parallel requests in batches.
 *
 * USAGE:
 * tsx load-tests/run.ts [options]
 *
 * OPTIONS:
 * --apiUrl=<url>             The API endpoint to test (default: http://localhost:4000/genererbrev)
 * --parallelRequests=<n>     Number of requests to send in parallel per batch (default: 10)
 * --batchCount=<n>           Number of batches to run (default: 3)
 * --batchDelayMs=<ms>        Delay between batches in milliseconds (default: 1000)
 * --timeoutMs=<ms>           Request timeout in milliseconds (default: 30000)
 * --apiKey=<key>             Optional API key for authentication
 * --jwt=<token>              Optional JWT bearer token for authentication
 * --outputFile=<path>        Path to save test results as JSON (e.g., ./results/test-results.json)
 * --savePdfsDir=<path>       Directory to save generated PDFs (e.g., ./results/pdfs)
 *
 * ENVIRONMENT VARIABLES:
 * The same options can be provided as environment variables:
 * API_URL, PARALLEL_REQUESTS, BATCH_COUNT, BATCH_DELAY_MS, TIMEOUT_MS,
 * API_KEY, JWT, OUTPUT_FILE, SAVE_PDFS_DIR
 *
 * EXAMPLES:
 * Basic test with default settings:
 *   tsx load-tests/run.ts
 *
 * Run 20 parallel requests in 5 batches:
 *   tsx load-tests/run.ts --parallelRequests=20 --batchCount=5
 *
 * Save results to file and PDFs to directory:
 *   tsx load-tests/run.ts --outputFile=./results/test.json --savePdfsDir=./results/pdfs
 *
 * Test against deployed API with API key:
 *   tsx load-tests/run.ts --apiUrl=https://api.example.com/genererbrev --apiKey=myapikey
 *
 * Test against deployed API with JWT:
 *   tsx load-tests/run.ts --apiUrl=https://api.example.com/genererbrev --jwt=myjwttoken
 */
async function main() {
  const args = process.argv.slice(2);
  const argMap: Record<string, string> = {};
  args.forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.substr(2).split("=");
      argMap[key] = value;
    }
  });

  const DEFAULT_API_URL = "http://localhost:4000/genererbrev";
  const DEFAULT_PARALLEL_REQUESTS = 10;
  const DEFAULT_BATCH_COUNT = 3;
  const DEFAULT_BATCH_DELAY_MS = 1000;
  const DEFAULT_TIMEOUT_MS = 30000;

  // Parse config from arguments with defaults
  const config: LoadTestConfig = {
    apiUrl: argMap.apiUrl ?? process.env.API_URL ?? DEFAULT_API_URL,
    parallelRequests: Number.parseInt(
      argMap.parallelRequests ?? process.env.PARALLEL_REQUESTS ?? String(DEFAULT_PARALLEL_REQUESTS),
    ),
    batchCount: Number.parseInt(
      argMap.batchCount ?? process.env.BATCH_COUNT ?? String(DEFAULT_BATCH_COUNT),
    ),
    batchDelayMs: Number.parseInt(
      argMap.batchDelayMs ?? process.env.BATCH_DELAY_MS ?? String(DEFAULT_BATCH_DELAY_MS),
    ),
    timeoutMs: Number.parseInt(
      argMap.timeoutMs ?? process.env.TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS),
    ),
    apiKey: argMap.apiKey ?? process.env.API_KEY,
    jwt: argMap.jwt ?? process.env.JWT,
    outputFile: argMap.outputFile ?? process.env.OUTPUT_FILE,
    savePdfsDir: argMap.savePdfsDir ?? process.env.SAVE_PDFS_DIR,
  };

  // Output the configuration
  console.log("Load Test Configuration:");
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Parallel Requests: ${config.parallelRequests}`);
  console.log(`Batch Count: ${config.batchCount}`);
  console.log(`Batch Delay: ${config.batchDelayMs}ms`);
  console.log(`Request Timeout: ${config.timeoutMs}ms`);
  console.log(`API Key: ${config.apiKey ? "Provided" : "Not Provided"}`);
  console.log(`JWT Token: ${config.jwt ? "Provided" : "Not Provided"}`);
  console.log(`Output File: ${config.outputFile ?? "Not Specified"}`);
  console.log(`Save PDFs to: ${config.savePdfsDir ?? "Disabled"}`);
  console.log("\nStarting load test...");

  if (config.savePdfsDir && fs.existsSync(config.savePdfsDir)) {
    deleteOldPdfs(config.savePdfsDir);
  }

  try {
    config.validator = (response: Response, buffer: Buffer, text: string, requestId: string) => {
      // Validate PDF has correct title
      if (!text.includes("Load Test PDF")) {
        throw new Error("Missing expected PDF title");
      }

      // Validate PDF contains the unique identifier
      if (!text.includes(requestId)) {
        throw new Error(`PDF missing unique identifier: ${requestId}`);
      }

      // Validate PDF size is reasonable
      if (buffer.length < 1000) {
        throw new Error(`PDF too small (${buffer.length} bytes)`);
      }
    };

    const startTime = Date.now();
    const result = await runLoadTest(config);

    // Write results to file if outputFile is specified
    if (config.outputFile) {
      // censor apiKey
      if (config.apiKey) {
        config.apiKey = config.apiKey.substring(0, 4) + "****";
      }
      if (config.jwt) {
        config.jwt = config.jwt.substring(0, 8) + "****";
      }

      const resultData: ResultData = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        config,
        result,
      };

      const outputDir = path.dirname(config.outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(config.outputFile, JSON.stringify(resultData, null, 2), "utf8");

      console.log(`Results written to ${config.outputFile}`);
    }

    // Success or failure summary
    if (result.failedRequests > 0) {
      console.error(`❌ Load test completed with ${result.failedRequests} failures`);
      process.exit(1);
    } else {
      console.log(
        `✅ Load test completed successfully with ${result.successfulRequests} successful requests`,
      );
      process.exit(0);
    }
  } catch (error) {
    console.error("Load test failed with error:", error);
    process.exit(1);
  }
}

await main();
