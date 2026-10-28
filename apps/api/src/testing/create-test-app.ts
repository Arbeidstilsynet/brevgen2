import { onTestFinished, vi } from "vitest";
import { buildApp } from "../app";
import type { GenerateDocument } from "../http/routes/genererbrev";
import { StartupHealthCheck } from "../http/routes/health";
import { RendererHealth } from "../renderer/health";

/** Builds the real app around a fake document generator and closes it when the test finishes. */
export async function createTestApp({
  auth = false,
  generateDocument = vi.fn<GenerateDocument>(async () => ({ content: "<p>ok</p>" })),
}: { auth?: boolean; generateDocument?: GenerateDocument } = {}) {
  // Auth reads its configuration when the app is built.
  vi.stubEnv("DANGEROUS_DISABLE_AUTH", auth ? "false" : "true");
  vi.stubEnv("AZURE_APPLICATION_ID", "test-application");
  const app = await buildApp({
    generateDocument,
    rendererHealth: new RendererHealth({
      maxConcurrentJobs: 1,
      stallThresholdMs: 100,
      recoveryGraceMs: 100,
    }),
    startupHealth: new StartupHealthCheck(async () => undefined),
  });
  onTestFinished(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });
  return app;
}
