import type { GenerateDocumentRequest } from "@repo/shared-types";
import { Readable } from "stream";
import { StartedDockerComposeEnvironment } from "testcontainers";

export interface TestEnvironment {
  environment: StartedDockerComposeEnvironment;
  genererBrevUrl: string;
  healthUrl: string;
  logStream: Readable;
}

export async function fetcher(url: string, payload: GenerateDocumentRequest) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  return await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function parseResponse(response: Response) {
  const base64Pdf = await response.text();
  const buffer = Buffer.from(base64Pdf, "base64");
  return buffer;
}

export async function setupLogStreaming(
  environment: StartedDockerComposeEnvironment,
  containerName: string,
): Promise<Readable> {
  const container = environment.getContainer(containerName);
  const logStream = await container.logs();

  logStream.on("data", (line) => {
    console.log(`[${containerName}]: ${line}`);
  });

  return logStream;
}
