import type { LoadTestProfile } from "./profiles";

export type { LoadTestProfile };

export interface RequestResult {
  requestId: string;
  profile: LoadTestProfile;
  success: boolean;
  status: number;
  timeMs: number;
  scheduledAtMs: number;
  startedAtMs: number;
  error?: string;
}

export interface LoadTestResult {
  requests: RequestResult[];
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTimeMs: number;
  averageRequestTimeMs: number;
}

export interface LoadTestConfig {
  /** Base URL for the API */
  apiUrl: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Requests per second at the beginning of the ramp */
  rampStartRequestsPerSecond: number;
  /** Requests per second at the end of the ramp and during the sustained phase */
  peakRequestsPerSecond: number;
  /** Duration of the linear arrival-rate ramp */
  rampDurationMs: number;
  /** Duration of the constant peak arrival-rate phase */
  sustainDurationMs: number;
  /** Optional JWT bearer token */
  jwt?: string;
  /** Optional output file for results */
  outputFile?: string;
  /** Directory to save generated PDFs (if provided) */
  savePdfsDir?: string;
  /** Custom validator function */
  validator?: (
    response: Response,
    buffer: Buffer,
    text: string,
    requestId: string,
  ) => void | Promise<void>;
}

export interface ResultData {
  timestamp: string;
  duration: number;
  config: LoadTestConfig;
  result: LoadTestResult;
}
