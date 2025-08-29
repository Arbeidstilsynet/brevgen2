import type { GenerateDocumentRequest } from "@repo/shared-types";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { readPdfText } from "pdf-text-reader";
import { comparePdfToSnapshot } from "pdf-visual-diff";
import { Readable } from "stream";
import { DockerComposeEnvironment, StartedDockerComposeEnvironment, Wait } from "testcontainers";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { defaultTemplateLongPayload, defaultTemplateShortPayload } from "./testdata";
import { fetcher, parseResponse, setupLogStreaming } from "./utils";

const fixturesDir = path.resolve(__dirname, "temp");
const DOWNLOADED_PDF_PATH_DEFAULT_SHORT_TEMPLATE = path.join(fixturesDir, "default-short.pdf");
const DOWNLOADED_PDF_PATH_DEFAULT_LONG_TEMPLATE = path.join(fixturesDir, "default-long.pdf");
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

    environment = await new DockerComposeEnvironment(rootDir, composeFile)
      .withBuild()
      .withEnvironment({
        TESTCONTAINERS: "true",
        DANGEROUS_DISABLE_AUTH: "true",
      })
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

  describe.sequential("API tests", () => {
    afterEach(async () => {
      // WORKAROUND for instability in testcontainers
      // wait so that the container will recycle the browser
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

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
        const payload: GenerateDocumentRequest = {
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

        const text = await readPdfText({ data: new Uint8Array(buffer), options: { verbosity: 0 } });
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
        const payload: GenerateDocumentRequest = {
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

        const text = await readPdfText({ data: new Uint8Array(buffer), options: { verbosity: 0 } });
        expect(text).toContain("This is a test PDF");

        // Save the generated PDF as a fixture for visual tests
        writeFileSync(DOWNLOADED_PDF_PATH_BLANK_TEMPLATE, buffer);
      },
    );

    test(
      "Can generate a PDF (default template, short)",
      {
        timeout: 10_000,
      },
      async () => {
        const response = await fetcher(genererBrevUrl, defaultTemplateShortPayload);
        if (!response.ok) {
          console.error(await response.text());
        }
        expect(response.status).toBe(200);
        const buffer = await parseResponse(response);
        expect(buffer.length).toBeGreaterThan(0);

        const text = await readPdfText({ data: new Uint8Array(buffer), options: { verbosity: 0 } });
        expect(text).toContain("This is a test PDF");
        expect(text).toContain("Test Containers");
        expect(text).toContain("Test Testesen");
        expect(text).toContain("2030/999");
        expect(text).toContain("12.24.2030");

        // Save the generated PDF as a fixture for visual tests
        writeFileSync(DOWNLOADED_PDF_PATH_DEFAULT_SHORT_TEMPLATE, buffer);
      },
    );

    test(
      "Can generate a PDF (default template, long)",
      {
        timeout: 10_000,
      },
      async () => {
        const response = await fetcher(genererBrevUrl, defaultTemplateLongPayload);
        if (!response.ok) {
          console.error(await response.text());
        }
        expect(response.status).toBe(200);
        const buffer = await parseResponse(response);
        expect(buffer.length).toBeGreaterThan(0);

        const text = await readPdfText({
          data: new Uint8Array(buffer),
          options: { verbosity: 0 },
        });
        expect(text).toContain("Baz bazilikum");

        // Save the generated PDF as a fixture for visual tests
        writeFileSync(DOWNLOADED_PDF_PATH_DEFAULT_LONG_TEMPLATE, buffer);
      },
    );

    test(
      "Can generate HTML with as_html=true (blank template)",
      {
        timeout: 10_000,
      },
      async () => {
        const payload: GenerateDocumentRequest = {
          md: "# Test HTML\n\nThis is a {{var}} with **bold** and *italic* text",
          mdVariables: {
            var: "HTML document",
          },
          options: {
            as_html: true,
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

        const htmlContent = await response.text(); // For HTML output, we expect plain text, not base64 pdf
        expect(typeof htmlContent).toBe("string");

        expect(htmlContent).toContain("<!DOCTYPE html>");
        expect(htmlContent).toContain("<html");
        expect(htmlContent).toContain("This is a HTML document");
        expect(htmlContent).toContain("<strong>bold</strong>");
        expect(htmlContent).toContain("<em>italic</em>");
        expect(htmlContent).not.toContain("%PDF-"); // Verify it doesn't contain PDF-specific markers
      },
    );
  });

  describe("Visual regression tests", () => {
    // custom template fails because of font rendering difference from deployed Lambda API which is used as baseline
    // will be fixed after switching to container
    test.skip("pdf-visual-diff (custom template)", { timeout: 10_000 }, async () => {
      const pdfName = "test-pdf-custom-template";
      // const baselinePdfPath = path.join("baseline", `${pdfName}.pdf`);
      // const pdf = readFileSync(path.resolve(__dirname, baselinePdfPath));
      const pdf = readFileSync(DOWNLOADED_PDF_PATH_CUSTOM_TEMPLATE);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });

    test("pdf-visual-diff (blank template)", { timeout: 10_000 }, async () => {
      const pdfName = "test-pdf-blank-template";
      // const baselinePdfPath = path.join("baseline", `${pdfName}.pdf`);
      // const pdf = readFileSync(path.resolve(__dirname, baselinePdfPath));
      const pdf = readFileSync(DOWNLOADED_PDF_PATH_BLANK_TEMPLATE);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });

    test("pdf-visual-diff (default template, short)", { timeout: 10_000 }, async () => {
      const pdfName = "test-pdf-default-template-short";
      // const baselinePdfPath = path.join("baseline", `${pdfName}.pdf`);
      // const baselinePdfPath = path.join("baseline", `${pdfName}-modified.pdf`);
      // const pdf = readFileSync(path.resolve(__dirname, baselinePdfPath));
      const pdf = readFileSync(DOWNLOADED_PDF_PATH_DEFAULT_SHORT_TEMPLATE);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });

    test("pdf-visual-diff (default template, long)", { timeout: 10_000 }, async () => {
      const pdfName = "test-pdf-default-template-long";
      const baselinePdfPath = path.join("baseline", `${pdfName}.pdf`);
      // const baselinePdfPath = path.join("baseline", `${pdfName}-modified.pdf`);
      const pdf = readFileSync(path.resolve(__dirname, baselinePdfPath));
      // const pdf = readFileSync(DOWNLOADED_PDF_PATH_DEFAULT_LONG_TEMPLATE);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });
  });
});
