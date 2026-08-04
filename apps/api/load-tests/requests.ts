import fs from "node:fs";
import path from "node:path";
import { readPdfText } from "pdf-text-reader";
import { createPayload, profileForRequest } from "./profiles";
import {
  type LoadTestConfig,
  type LoadTestProfile,
  type LoadTestResult,
  type RequestResult,
} from "./types";

/**
 * Create planned request offsets for a linear ramp followed by a sustained rate.
 */
export function createArrivalSchedule(config: LoadTestConfig): number[] {
  const { rampStartRequestsPerSecond, peakRequestsPerSecond, rampDurationMs, sustainDurationMs } =
    config;
  const rampDurationSeconds = rampDurationMs / 1000;
  const rateIncrease = (peakRequestsPerSecond - rampStartRequestsPerSecond) / rampDurationSeconds;
  const rampRequestCount = Math.floor(
    rampStartRequestsPerSecond * rampDurationSeconds +
      (rateIncrease * rampDurationSeconds ** 2) / 2,
  );
  const schedule = Array.from({ length: rampRequestCount }, (_, index) => {
    const requestNumber = index + 1;
    const seconds =
      rateIncrease === 0
        ? requestNumber / rampStartRequestsPerSecond
        : (-rampStartRequestsPerSecond +
            Math.sqrt(rampStartRequestsPerSecond ** 2 + 2 * rateIncrease * requestNumber)) /
          rateIncrease;
    return Math.round(seconds * 1000);
  });

  const sustainRequestCount = Math.floor((peakRequestsPerSecond * sustainDurationMs) / 1000);
  for (let requestNumber = 1; requestNumber <= sustainRequestCount; requestNumber++) {
    schedule.push(rampDurationMs + Math.round((requestNumber * 1000) / peakRequestsPerSecond));
  }

  return schedule;
}

export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const { savePdfsDir } = config;

  if (savePdfsDir && !fs.existsSync(savePdfsDir)) {
    fs.mkdirSync(savePdfsDir, { recursive: true });
  }

  const startTime = Date.now();
  const schedule = createArrivalSchedule(config);
  const requests: Promise<RequestResult>[] = [];
  let completedRequests = 0;
  let completedSuccessfulRequests = 0;

  console.log(`Starting load test with ${schedule.length} scheduled requests`);
  const progressTimer = setInterval(() => {
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(0);
    const inFlightRequests = requests.length - completedRequests;
    console.log(
      `Progress after ${elapsedSeconds}s: ${requests.length}/${schedule.length} started, ${completedRequests} completed (${completedSuccessfulRequests} successful, ${completedRequests - completedSuccessfulRequests} failed), ${inFlightRequests} in flight`,
    );
  }, 10_000);

  let requestResults: RequestResult[];
  try {
    for (const [requestNumber, scheduledAtMs] of schedule.entries()) {
      const delayMs = startTime + scheduledAtMs - Date.now();
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const requestId = `request-${requestNumber + 1}`;
      const profile = profileForRequest(requestNumber);
      const request = createAndSendRequest(config, {
        requestId,
        profile,
        scheduledAtMs,
        testStartedAtMs: startTime,
      }).then((result) => {
        completedRequests++;
        if (result.success) {
          completedSuccessfulRequests++;
        }
        return result;
      });
      requests.push(request);
    }
    requestResults = await Promise.all(requests);
  } finally {
    clearInterval(progressTimer);
  }

  const totalTimeMs = Date.now() - startTime;
  const totalRequests = requestResults.length;
  const successfulRequests = requestResults.filter((request) => request.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const averageRequestTimeMs =
    totalRequests === 0
      ? 0
      : requestResults.reduce((sum, request) => sum + request.timeMs, 0) / totalRequests;

  const result: LoadTestResult = {
    requests: requestResults,
    totalRequests,
    successfulRequests,
    failedRequests,
    totalTimeMs,
    averageRequestTimeMs,
  };

  const percentageOfTotal = (count: number) =>
    totalRequests === 0 ? "0.0" : ((count / totalRequests) * 100).toFixed(1);

  console.log(`Load test completed in ${totalTimeMs}ms`);
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Successful: ${successfulRequests} (${percentageOfTotal(successfulRequests)}%)`);
  console.log(`Failed: ${failedRequests} (${percentageOfTotal(failedRequests)}%)`);
  console.log(`Average request time: ${averageRequestTimeMs.toFixed(2)}ms`);

  return result;
}

/** Everything that identifies a single planned request within a load test run. */
interface ScheduledRequest {
  requestId: string;
  profile: LoadTestProfile;
  /** Planned offset from the start of the test, in milliseconds */
  scheduledAtMs: number;
  /** Wall-clock time the test started, used to derive the actual start offset */
  testStartedAtMs: number;
}

async function createAndSendRequest(
  config: LoadTestConfig,
  scheduled: ScheduledRequest,
): Promise<RequestResult> {
  const { apiUrl, jwt, timeoutMs, validator, savePdfsDir } = config;
  const { requestId, profile, scheduledAtMs, testStartedAtMs } = scheduled;
  const payload = createPayload(profile, requestId);
  const startTime = Date.now();
  const startedAtMs = startTime - testStartedAtMs;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers = new Headers({ "Content-Type": "application/json" });
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
        profile,
        success: false,
        status: response.status,
        timeMs,
        scheduledAtMs,
        startedAtMs,
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
          profile,
          success: false,
          status: response.status,
          timeMs,
          scheduledAtMs,
          startedAtMs,
          error: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    return {
      requestId,
      profile,
      success: true,
      status: response.status,
      timeMs,
      scheduledAtMs,
      startedAtMs,
    };
  } catch (error) {
    const timeMs = Date.now() - startTime;
    return {
      requestId,
      profile,
      success: false,
      status: 0, // No HTTP status for network or timeout errors
      timeMs,
      scheduledAtMs,
      startedAtMs,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
