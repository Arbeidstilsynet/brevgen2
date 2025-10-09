import type { GenerateDocumentRequest } from "@repo/shared-types";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { readPdfText } from "pdf-text-reader";
import { comparePdfToSnapshot } from "pdf-visual-diff";
import { Readable } from "stream";
import { DockerComposeEnvironment, StartedDockerComposeEnvironment, Wait } from "testcontainers";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import {
  defaultTemplateAllOptionalsPayload,
  defaultTemplateLongPayload,
  defaultTemplateShortPayload,
} from "./testdata";
import { fetcher, parseResponse, setupLogStreaming } from "./utils";

const tempDir = path.resolve(__dirname, "temp");
const baselineDir = path.resolve(__dirname, "baseline");

const pdfNames = {
  defaultShort: "test-pdf-default-template-short",
  defaultLong: "test-pdf-default-template-long",
  defaultAllOptionals: "test-pdf-default-template-all-optionals",
  custom: "test-pdf-custom-template",
  blank: "test-pdf-blank-template",
} as const;

const paths = {
  temp: {
    defaultShort: path.join(tempDir, "default-short.pdf"),
    defaultLong: path.join(tempDir, "default-long.pdf"),
    defaultAllOptionals: path.join(tempDir, "default-all-optionals.pdf"),
    custom: path.join(tempDir, "custom.pdf"),
    blank: path.join(tempDir, "blank.pdf"),
  },
  baseline: {
    defaultShort: path.join(baselineDir, pdfNames.defaultShort + ".pdf"),
    defaultLong: path.join(baselineDir, pdfNames.defaultLong + ".pdf"),
    defaultAllOptionals: path.join(baselineDir, pdfNames.defaultAllOptionals + ".pdf"),
    custom: path.join(baselineDir, pdfNames.custom + ".pdf"),
    blank: path.join(baselineDir, pdfNames.blank + ".pdf"),
  },
} as const;

if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
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

        writeFileSync(paths.temp.custom, buffer); // Save the generated PDF as a fixture for visual tests
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

        writeFileSync(paths.temp.blank, buffer); // Save the generated PDF as a fixture for visual tests
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

        writeFileSync(paths.temp.defaultShort, buffer); // Save the generated PDF as a fixture for visual tests
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

        writeFileSync(paths.temp.defaultLong, buffer); // Save the generated PDF as a fixture for visual tests
      },
    );

    test(
      "Can generate a PDF (default template, all optionals)",
      {
        timeout: 10_000,
      },
      async () => {
        const response = await fetcher(genererBrevUrl, defaultTemplateAllOptionalsPayload);
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
        expect(text).toContain("This is a test PDF");
        expect(text).toContain("Tidlegare referanse: 2029/888");
        expect(text).toContain("Dykkar dato: 11.11.2030");
        expect(text).toContain("Dykkar referanse: 2030-1234-5678");
        expect(text).toContain("Unntatt offentlegheit, jf. offl. § 14");

        writeFileSync(paths.temp.defaultAllOptionals, buffer); // Save the generated PDF as a fixture for visual tests
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
    test("pdf-visual-diff (custom template)", { timeout: 10_000 }, async () => {
      const pdfName = pdfNames.custom;
      const pdf = readFileSync(paths.temp.custom);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });

    test("pdf-visual-diff (blank template)", { timeout: 10_000 }, async () => {
      const pdfName = pdfNames.blank;
      const pdf = readFileSync(paths.temp.blank);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });

    test("pdf-visual-diff (default template, short)", { timeout: 10_000 }, async () => {
      const pdfName = pdfNames.defaultShort;
      const pdf = readFileSync(paths.temp.defaultShort);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });

    test("pdf-visual-diff (default template, long)", { timeout: 20_000 }, async () => {
      const pdfName = pdfNames.defaultLong;
      const pdf = readFileSync(paths.temp.defaultLong);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });

    test("pdf-visual-diff (default template, all optionals)", { timeout: 10_000 }, async () => {
      const pdfName = pdfNames.defaultAllOptionals;
      const pdf = readFileSync(paths.temp.defaultAllOptionals);

      const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
        tolerance: 0.05,
      });
      expect(matched).toBe(true);
    });
  });
});
