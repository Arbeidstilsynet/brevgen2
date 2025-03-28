import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { readPdfText } from "pdf-text-reader";
import { comparePdfToSnapshot } from "pdf-visual-diff";
import { Readable } from "stream";
import { DockerComposeEnvironment, StartedDockerComposeEnvironment, Wait } from "testcontainers";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { HandlerGeneratePdfArgs } from "../lib/handler";

async function fetcher(url: string, payload: HandlerGeneratePdfArgs) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  return await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

async function parseResponse(response: Response) {
  const base64Pdf = await response.text();
  const buffer = Buffer.from(base64Pdf, "base64");
  return buffer;
}

async function setupLogStreaming(
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

const fixturesDir = path.resolve(__dirname, "temp");
const DOWNLOADED_PDF_PATH_DEFAULT_TEMPLATE = path.join(fixturesDir, "default.pdf");
const DOWNLOADED_PDF_PATH_CUSTOM_TEMPLATE = path.join(fixturesDir, "custom.pdf");
const DOWNLOADED_PDF_PATH_BLANK_TEMPLATE = path.join(fixturesDir, "blank.pdf");

if (!existsSync(fixturesDir)) {
  mkdirSync(fixturesDir, { recursive: true });
}

// run inner describes in sequence
// as the visual regression tests are dependent on the downloaded PDFs from api tests
describe.sequential("Integration tests with testcontainers", () => {
  let environment: StartedDockerComposeEnvironment;
  let genererBrevUrl: string;
  let healthUrl: string;
  let logStream: Readable;

  beforeAll(async () => {
    console.log("Setting up Docker Compose environment...");

    const rootDir = path.resolve(__dirname, "../../../");
    const composeFile = "compose.yaml";
    const composeFilePath = path.join(rootDir, composeFile);

    if (!existsSync(composeFilePath)) {
      throw new Error(`Compose file not found at ${composeFilePath}`);
    }
    console.log(`Docker Compose file exists at: ${composeFilePath}`);

    environment = await new DockerComposeEnvironment(rootDir, composeFile)
      .withBuild()
      .withWaitStrategy("api-1", Wait.forHealthCheck())
      .up(["api"]); // Only start the API service

    console.log("Docker Compose environment started");

    logStream = await setupLogStreaming(environment, "api-1");

    const apiContainer = environment.getContainer("api-1");
    const apiHost = apiContainer.getHost();
    const apiPort = apiContainer.getMappedPort(4000);
    genererBrevUrl = `http://${apiHost}:${apiPort}/genererbrev`;
    healthUrl = `http://${apiHost}:${apiPort}/health`;

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
  }, 180_000); // Increase timeout to 3 minutes since building containers can take time

  afterAll(async () => {
    console.log("Tearing down Docker Compose environment...");

    if (logStream) {
      logStream.destroy();
    }
    if (environment) {
      await environment.down();
    }
  }, 60_000);

  describe.concurrent("API tests", () => {
    test("Health endpoint returns 200", async () => {
      const response = await fetch(healthUrl);
      expect(response.status).toBe(200);
    });

    test(
      "Can generate a PDF (custom template)",
      {
        timeout: 10_000,
      },
      async () => {
        const payload: HandlerGeneratePdfArgs = {
          md: "# Test PDF\n\nThis is a {{var}}",
          mdVariables: {
            var: "test PDF",
          },
          options: {
            dynamic: {
              template: "custom",
            },
          },
        };

        const response = await fetcher(genererBrevUrl, payload);

        if (!response.ok) {
          console.error(await response.text());
        }
        expect(response.status).toBe(200);
        const buffer = await parseResponse(response);
        expect(buffer.length).toBeGreaterThan(0);

        const text = await readPdfText({ data: new Uint8Array(buffer) });
        expect(text).toContain("This is a test PDF");

        // Save the generated PDF as a fixture for visual tests
        writeFileSync(DOWNLOADED_PDF_PATH_CUSTOM_TEMPLATE, buffer);
      },
    );

    test(
      "Can generate a PDF (blank template)",
      {
        timeout: 10_000,
      },
      async () => {
        const payload: HandlerGeneratePdfArgs = {
          md: "# Test PDF\n\nThis is a {{var}}",
          mdVariables: {
            var: "test PDF",
          },
          options: {
            dynamic: {
              template: "blank",
            },
          },
        };

        const response = await fetcher(genererBrevUrl, payload);

        if (!response.ok) {
          console.error(await response.text());
        }
        expect(response.status).toBe(200);
        const buffer = await parseResponse(response);
        expect(buffer.length).toBeGreaterThan(0);

        const text = await readPdfText({ data: new Uint8Array(buffer) });
        expect(text).toContain("This is a test PDF");

        // Save the generated PDF as a fixture for visual tests
        writeFileSync(DOWNLOADED_PDF_PATH_BLANK_TEMPLATE, buffer);
      },
    );

    test(
      "Can generate a PDF (default template)",
      {
        timeout: 10_000,
      },
      async () => {
        const payload: HandlerGeneratePdfArgs = {
          md: "# Test PDF\n\nThis is a {{var}}",
          mdVariables: {
            var: "test PDF",
          },
          options: {
            dynamic: {
              template: "default",
              defaultTemplateArgs: {
                language: "bm",
                signatureVariant: "automatiskBehandlet",
                fields: {
                  dato: "12.24.2030",
                  saksnummer: "2030/999",
                  saksbehandlerNavn: "Test Testesen",
                  virksomhet: {
                    navn: "Test Containers",
                    adresse: "Testveien 1",
                    postnr: "1234",
                    poststed: "Teststed",
                  },
                },
              },
            },
          },
        };

        const response = await fetcher(genererBrevUrl, payload);

        if (!response.ok) {
          console.error(await response.text());
        }
        expect(response.status).toBe(200);
        const buffer = await parseResponse(response);
        expect(buffer.length).toBeGreaterThan(0);

        const text = await readPdfText({ data: new Uint8Array(buffer) });
        expect(text).toContain("This is a test PDF");
        expect(text).toContain("Test Containers");
        expect(text).toContain("Test Testesen");
        expect(text).toContain("2030/999");
        expect(text).toContain("12.24.2030");

        // Save the generated PDF as a fixture for visual tests
        writeFileSync(DOWNLOADED_PDF_PATH_DEFAULT_TEMPLATE, buffer);
      },
    );
  });

  describe("Visual regression tests", () => {
    // custom template fails because of font rendering difference from deployed Lambda API which is used as baseline
    // will be fixed after switching to container
    test.skip("pdf-visual-diff (custom template)", { timeout: 30_000 }, async () => {
      const pdfName = "test-pdf-custom-template";
      // const baselinePdfPath = path.join("baseline", `${pdfName}.pdf`);
      // const pdf = readFileSync(path.resolve(__dirname, baselinePdfPath));
      const pdf = readFileSync(DOWNLOADED_PDF_PATH_CUSTOM_TEMPLATE);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });

    test("pdf-visual-diff (blank template)", { timeout: 30_000 }, async () => {
      const pdfName = "test-pdf-blank-template";
      // const baselinePdfPath = path.join("baseline", `${pdfName}.pdf`);
      // const pdf = readFileSync(path.resolve(__dirname, baselinePdfPath));
      const pdf = readFileSync(DOWNLOADED_PDF_PATH_BLANK_TEMPLATE);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });

    test("pdf-visual-diff (default template)", { timeout: 30_000 }, async () => {
      const pdfName = "test-pdf-default-template";
      // const baselinePdfPath = path.join("baseline", `${pdfName}.pdf`);
      // const baselinePdfPath = path.join("baseline", `${pdfName}-modified.pdf`);
      // const pdf = readFileSync(path.resolve(__dirname, baselinePdfPath));
      const pdf = readFileSync(DOWNLOADED_PDF_PATH_DEFAULT_TEMPLATE);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });
  });
});
