export interface RequestResult {
  requestId: string;
  success: boolean;
  status: number;
  timeMs: number;
  error?: string;
}

export interface BatchResult {
  batchId: number;
  requests: RequestResult[];
  totalTimeMs: number;
  successCount: number;
  failureCount: number;
}

export interface LoadTestResult {
  batches: BatchResult[];
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTimeMs: number;
  averageRequestTimeMs: number;
}

export interface LoadTestConfig {
  /** Number of parallel requests to send in each batch */
  parallelRequests: number;
  /** Number of batches to run */
  batchCount: number;
  /** Base URL for the API */
  apiUrl: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Delay between batches in milliseconds */
  batchDelayMs: number;
  /** Optional API key */
  apiKey?: string;
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
