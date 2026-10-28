import { configDotenv } from "dotenv";
import { buildApp } from "./app";
import { createDocumentGenerator } from "./generation/document-generator";
import { createGenerationSchedulerFromEnvironment } from "./generation/scheduler";
import { StartupHealthCheck } from "./http/routes/health";
import { logger } from "./observability/logger";
import { mdToPdf } from "./renderer";
import { defaultConfig } from "./renderer/config";
import { registerRendererHealthMetrics } from "./renderer/health-metrics";

configDotenv();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const generationScheduler = createGenerationSchedulerFromEnvironment();
const documentGenerator = createDocumentGenerator({
  scheduler: generationScheduler,
  render: mdToPdf,
});
registerRendererHealthMetrics(generationScheduler.rendererHealth);
const startupHealth = new StartupHealthCheck(
  () =>
    generationScheduler.schedule(({ progress, timeoutMs }) =>
      mdToPdf("# Brevgenerator startup check", defaultConfig, progress, timeoutMs),
    ),
  (error) => {
    logger.error(
      { event: "renderer.startup_warmup.failed", err: error },
      "Renderer startup warm-up failed",
    );
  },
);

const app = await buildApp({
  generateDocument: (request, signal) => documentGenerator.generate(request, signal),
  rendererHealth: generationScheduler.rendererHealth,
  startupHealth,
});
app.addHook("onClose", async () => {
  generationScheduler.rendererHealth.stop();
});

await app.listen({
  port,
  host: "0.0.0.0", // Listen on all interfaces
});
