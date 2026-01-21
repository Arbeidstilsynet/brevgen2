import { existsSync } from "node:fs";
import path from "node:path";
import { Readable } from "stream";
import { DockerComposeEnvironment, StartedDockerComposeEnvironment } from "testcontainers";
import { afterAll, beforeAll, describe } from "vitest";
import { genererBrevTests } from "./tests/genererbrevTests";
import { validationTests } from "./tests/validationTests";
import { visualTests } from "./tests/visualTests";
import { setupLogStreaming } from "./utils";

export interface TestEnvironment {
  environment: StartedDockerComposeEnvironment;
  genererBrevUrl: string;
  healthUrl: string;
  logStream: Readable;
}

// run inner describes in sequence
// as the visual regression tests are dependent on the downloaded PDFs from api tests
describe.sequential("Integration tests with testcontainers", () => {
  let testEnv: TestEnvironment | null;

  beforeAll(async () => {
    console.log("Setting up Docker Compose environment...");

    const rootDir = path.resolve(__dirname, "../../../");
    const composeFile = "compose.yaml";
    const composeFilePath = path.join(rootDir, composeFile);

    if (!existsSync(composeFilePath)) {
      throw new Error(`Compose file not found at ${composeFilePath}`);
    }

    const environment = await new DockerComposeEnvironment(rootDir, composeFile)
      .withBuild()
      .withEnvironment({
        TESTCONTAINERS: "true",
        DANGEROUS_DISABLE_AUTH: "true",
      })
      // .withWaitStrategy("api-1", Wait.forHealthCheck())
      .up(["api"]); // Only start the API service

    console.log("Docker Compose environment started");

    const logStream = await setupLogStreaming(environment, "api-1");

    const apiContainer = environment.getContainer("api-1");
    const apiHost = apiContainer.getHost();
    const apiPort = apiContainer.getMappedPort(4000);
    const genererBrevUrl = `http://${apiHost}:${apiPort}/genererbrev`;
    const healthUrl = `http://${apiHost}:${apiPort}/health`;

    console.log({
      genererBrevUrl,
      apiContainer: {
        id: apiContainer.getId(),
        name: apiContainer.getName(),
        labels: apiContainer.getLabels(),
        host: apiContainer.getHost(),
        hostname: apiContainer.getHostname(),
        networkNames: apiContainer.getNetworkNames(),
      },
    });

    // Give the API a moment to fully initialize
    await new Promise((resolve) => setTimeout(resolve, 5000));

    testEnv = {
      environment,
      genererBrevUrl,
      healthUrl,
      logStream,
    };
  }, 240_000); // Increase timeout to 4 minutes since building containers can take time

  afterAll(async () => {
    console.log("Tearing down Docker Compose environment...");
    if (!testEnv) {
      console.warn("Test environment was not set up. Skipping teardown.");
      return;
    }
    const { environment, logStream } = testEnv;

    if (logStream) {
      logStream.destroy();
    }
    if (environment) {
      await environment.down();
    }
  }, 60_000);

  describe("Schema validation tests", () => {
    validationTests(() => testEnv!);
  });

  describe.sequential("API tests - /genererbrev", () => {
    genererBrevTests(() => testEnv!);
  });

  describe("Visual regression tests", () => {
    visualTests();
  });
});
