import fs from "node:fs";
import path from "node:path";
import { runLoadTest } from "./requests";
import { LoadTestConfig, ResultData } from "./types";
import { deleteOldPdfs } from "./utils";

/**
 * PDF Generator Load Testing Tool
 *
 * This script executes load tests against the PDF generator API by sending
 * a linear request-rate ramp followed by a sustained peak.
 *
 * USAGE:
 * tsx load-tests/run.ts [options]
 *
 * OPTIONS:
 * --apiUrl=<url>             The API endpoint to test (default: http://localhost:4000/genererbrev)
 * --rampStartRps=<n>         Requests per second at the beginning of the ramp (default: 0.25)
 * --peakRps=<n>              Requests per second at the ramp peak (default: 2)
 * --rampDurationMs=<ms>      Ramp duration in milliseconds (default: 30000)
 * --sustainDurationMs=<ms>   Sustained peak duration in milliseconds (default: 90000)
 * --timeoutMs=<ms>           Request timeout in milliseconds (default: 90000)
 * --jwt=<token>              Optional JWT bearer token for authentication
 * --outputFile=<path>        Path to save test results as JSON (e.g., ./results/test-results.json)
 * --savePdfsDir=<path>       Directory to save generated PDFs (e.g., ./results/pdfs)
 *
 * ENVIRONMENT VARIABLES:
 * The same options can be provided as environment variables:
 * API_URL, RAMP_START_RPS, PEAK_RPS, RAMP_DURATION_MS, SUSTAIN_DURATION_MS, TIMEOUT_MS,
 * JWT, OUTPUT_FILE, SAVE_PDFS_DIR
 *
 * EXAMPLES:
 * Basic test with default settings:
 *   tsx load-tests/run.ts
 *
 * Ramp from 0.25 to 2 requests per second, then sustain the peak:
 *   tsx load-tests/run.ts --rampStartRps=0.25 --peakRps=2 --rampDurationMs=30000 --sustainDurationMs=90000
 *
 * Save results to file and PDFs to directory:
 *   tsx load-tests/run.ts --outputFile=./results/test.json --savePdfsDir=./results/pdfs
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
  const DEFAULT_RAMP_START_RPS = 0.25;
  const DEFAULT_PEAK_RPS = 2;
  const DEFAULT_RAMP_DURATION_MS = 30_000;
  const DEFAULT_SUSTAIN_DURATION_MS = 90_000;
  const DEFAULT_TIMEOUT_MS = 90000;

  // Parse config from arguments with defaults
  const config: LoadTestConfig = {
    apiUrl: argMap.apiUrl ?? process.env.API_URL ?? DEFAULT_API_URL,
    rampStartRequestsPerSecond: Number.parseFloat(
      argMap.rampStartRps ?? process.env.RAMP_START_RPS ?? String(DEFAULT_RAMP_START_RPS),
    ),
    peakRequestsPerSecond: Number.parseFloat(
      argMap.peakRps ?? process.env.PEAK_RPS ?? String(DEFAULT_PEAK_RPS),
    ),
    rampDurationMs: Number.parseInt(
      argMap.rampDurationMs ?? process.env.RAMP_DURATION_MS ?? String(DEFAULT_RAMP_DURATION_MS),
    ),
    sustainDurationMs: Number.parseInt(
      argMap.sustainDurationMs ??
        process.env.SUSTAIN_DURATION_MS ??
        String(DEFAULT_SUSTAIN_DURATION_MS),
    ),
    timeoutMs: Number.parseInt(
      argMap.timeoutMs ?? process.env.TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS),
    ),
    jwt: argMap.jwt ?? process.env.JWT,
    outputFile: argMap.outputFile ?? process.env.OUTPUT_FILE,
    savePdfsDir: argMap.savePdfsDir ?? process.env.SAVE_PDFS_DIR,
  };

  // Output the configuration
  console.log("Load Test Configuration:");
  console.log(`API URL: ${config.apiUrl}`);
  console.log(
    `Ramp: ${config.rampStartRequestsPerSecond} to ${config.peakRequestsPerSecond} requests/s over ${config.rampDurationMs}ms`,
  );
  console.log(`Sustained peak duration: ${config.sustainDurationMs}ms`);
  console.log(`Request Timeout: ${config.timeoutMs}ms`);
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
