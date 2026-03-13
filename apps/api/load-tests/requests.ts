import type { GenerateDocumentRequest } from "@repo/shared-types";
import fs from "node:fs";
import path from "node:path";
import { readPdfText } from "pdf-text-reader";
import { BatchResult, LoadTestConfig, LoadTestResult, RequestResult } from "./types";

/**
 * Run a load test with configurable parallel requests
 */
export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const {
    parallelRequests,
    batchCount,
    apiUrl,
    timeoutMs = 30000,
    batchDelayMs = 1000,
    apiKey,
    jwt,
    savePdfsDir,
  } = config;

  if (savePdfsDir && !fs.existsSync(savePdfsDir)) {
    fs.mkdirSync(savePdfsDir, { recursive: true });
  }

  const startTime = Date.now();
  const batches: BatchResult[] = [];

  console.log(
    `Starting load test with ${parallelRequests} parallel requests x ${batchCount} batches`,
  );

  for (let batchId = 0; batchId < batchCount; batchId++) {
    console.log(`Starting batch ${batchId + 1}/${batchCount}`);
    const batchStartTime = Date.now();

    const requests = Array.from({ length: parallelRequests }).map((_, requestIndex) => {
      const requestId = `request-${batchId + 1}-${requestIndex + 1}`;
      return createAndSendRequest(
        apiUrl,
        requestId,
        apiKey,
        jwt,
        timeoutMs,
        config.validator,
        savePdfsDir,
      );
    });

    const results = await Promise.all(requests);

    const batchTimeMs = Date.now() - batchStartTime;
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    batches.push({
      batchId,
      requests: results,
      totalTimeMs: batchTimeMs,
      successCount,
      failureCount,
    });

    console.log(
      `Batch ${batchId + 1} completed: ${successCount} successes, ${failureCount} failures, time: ${batchTimeMs}ms`,
    );

    // Add delay between batches if not the last batch
    if (batchId < batchCount - 1 && batchDelayMs > 0) {
      console.log(`Waiting ${batchDelayMs}ms before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
    }
  }

  const totalTimeMs = Date.now() - startTime;
  const totalRequests = batches.reduce((sum, batch) => sum + batch.requests.length, 0);
  const successfulRequests = batches.reduce((sum, batch) => sum + batch.successCount, 0);
  const failedRequests = batches.reduce((sum, batch) => sum + batch.failureCount, 0);
  const averageRequestTimeMs =
    batches.reduce(
      (sumBatches, batch) =>
        sumBatches + batch.requests.reduce((sumRequests, req) => sumRequests + req.timeMs, 0),
      0,
    ) / totalRequests;

  const result: LoadTestResult = {
    batches,
    totalRequests,
    successfulRequests,
    failedRequests,
    totalTimeMs,
    averageRequestTimeMs,
  };

  console.log(`Load test completed in ${totalTimeMs}ms`);
  console.log(`Total requests: ${totalRequests}`);
  console.log(
    `Successful: ${successfulRequests} (${((successfulRequests / totalRequests) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Failed: ${failedRequests} (${((failedRequests / totalRequests) * 100).toFixed(1)}%)`,
  );
  console.log(`Average request time: ${averageRequestTimeMs.toFixed(2)}ms`);

  return result;
}

async function createAndSendRequest(
  apiUrl: string,
  requestId: string,
  apiKey?: string,
  jwt?: string,
  timeoutMs = 30000,
  validator?: LoadTestConfig["validator"],
  savePdfsDir?: string,
): Promise<RequestResult> {
  const payload: GenerateDocumentRequest = {
    md: "# Load Test PDF\n\nThis is a unique identifier: {{requestId}}\n\nThis document was generated for load testing.",
    mdVariables: {
      requestId,
    },
    options: {
      document_title: `Load Test - ${requestId}`,
      dynamic: {
        template: "blank",
      },
    },
  };

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers = new Headers({ "Content-Type": "application/json" });
    if (apiKey) {
      headers.set("x-api-key", apiKey);
    }
    if (jwt) {
      headers.set("Authorization", `Bearer ${jwt}`);
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const timeMs = Date.now() - startTime;

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        requestId,
        success: false,
        status: response.status,
        timeMs,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const base64Pdf = await response.text();
    const buffer = Buffer.from(base64Pdf, "base64");

    if (savePdfsDir) {
      const pdfFilename = `load-test-${requestId}.pdf`;
      const pdfPath = path.join(savePdfsDir, pdfFilename);
      fs.writeFileSync(pdfPath, buffer);
    }

    if (validator) {
      try {
        const text = await readPdfText({
          data: new Uint8Array(buffer),
          options: { verbosity: 0 },
        });
        await validator(response, buffer, text, requestId);
      } catch (error) {
        return {
          requestId,
          success: false,
          status: response.status,
          timeMs,
          error: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    return {
      requestId,
      success: true,
      status: response.status,
      timeMs,
    };
  } catch (error) {
    const timeMs = Date.now() - startTime;
    return {
      requestId,
      success: false,
      status: 0, // No HTTP status for network or timeout errors
      timeMs,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
