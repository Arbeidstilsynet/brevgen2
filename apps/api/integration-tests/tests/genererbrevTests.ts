import { GenerateDocumentRequest } from "@repo/shared-types";
import { writeFileSync } from "node:fs";
import { readPdfText } from "pdf-text-reader";
import { afterEach, beforeAll, expect, test } from "vitest";
import { paths } from "../paths";
import {
  defaultTemplateAllOptionalsPayload,
  defaultTemplateLongPayload,
  defaultTemplateShortPayload,
  direktoratTemplateShortPayload,
  direktoratTemplateWithSignaturesPayload,
} from "../testdata";
import { fetcher, parseResponse, TestEnvironment } from "../utils";

export function genererBrevTests(getTestEnv: () => TestEnvironment) {
  let testEnv: TestEnvironment;

  beforeAll(() => {
    testEnv = getTestEnv();
  });

  afterEach(async () => {
    // WORKAROUND for instability in testcontainers
    // wait so that the container will recycle the browser
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  test("Health endpoint returns 200", async () => {
    const response = await fetch(testEnv.healthUrl);
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

      const response = await fetcher(testEnv.genererBrevUrl, payload);
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

      const response = await fetcher(testEnv.genererBrevUrl, payload);
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
      const response = await fetcher(testEnv.genererBrevUrl, defaultTemplateShortPayload);
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
      const response = await fetcher(testEnv.genererBrevUrl, defaultTemplateLongPayload);
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
      expect(text).toContain("Qux bazilikum");

      writeFileSync(paths.temp.defaultLong, buffer); // Save the generated PDF as a fixture for visual tests
    },
  );

  test(
    "Can generate a PDF (default template, all optionals)",
    {
      timeout: 10_000,
    },
    async () => {
      const response = await fetcher(testEnv.genererBrevUrl, defaultTemplateAllOptionalsPayload);
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

      const response = await fetcher(testEnv.genererBrevUrl, payload);
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

  test(
    "Can generate a PDF (direktorat template, short)",
    {
      timeout: 10_000,
    },
    async () => {
      const response = await fetcher(testEnv.genererBrevUrl, direktoratTemplateShortPayload);
      if (!response.ok) {
        console.error(await response.text());
      }
      expect(response.status).toBe(200);
      const buffer = await parseResponse(response);
      expect(buffer.length).toBeGreaterThan(0);

      const text = await readPdfText({ data: new Uint8Array(buffer), options: { verbosity: 0 } });
      expect(text).toContain("This is a direktorat test PDF");
      expect(text).toContain("Mottaker AS");
      expect(text).toContain("Direktør Direktoratsen");
      expect(text).toContain("2026/1234");
      expect(text).toContain("22.01.2026");

      writeFileSync(paths.temp.direktoratShort, buffer);
    },
  );

  test(
    "Can generate a PDF (direktorat template, with signatures)",
    {
      timeout: 10_000,
    },
    async () => {
      const response = await fetcher(
        testEnv.genererBrevUrl,
        direktoratTemplateWithSignaturesPayload,
      );
      if (!response.ok) {
        console.error(await response.text());
      }
      expect(response.status).toBe(200);
      const buffer = await parseResponse(response);
      expect(buffer.length).toBeGreaterThan(0);

      const text = await readPdfText({ data: new Uint8Array(buffer), options: { verbosity: 0 } });
      expect(text).toContain("This is a signed direktorat PDF");
      expect(text).toContain("Bedrift AS");
      expect(text).toContain("Kari Nordmann");
      expect(text).toContain("2026/5678");
      expect(text).toContain("Ola Nordmann");
      expect(text).toContain("Avdelingsdirektør");

      writeFileSync(paths.temp.direktoratWithSignatures, buffer);
    },
  );

  test(
    "Can generate a PDF (direktorat template, minimal fields)",
    {
      timeout: 10_000,
    },
    async () => {
      const payload: GenerateDocumentRequest = {
        md: "# Minimal Direktorat\n\nThis is a minimal direktorat PDF",
        options: {
          dynamic: {
            template: "direktorat",
            direktoratTemplateArgs: {
              language: "bm",
              signatureVariant: "usignert",
              fields: {},
            },
          },
        },
      };

      const response = await fetcher(testEnv.genererBrevUrl, payload);
      if (!response.ok) {
        console.error(await response.text());
      }
      expect(response.status).toBe(200);
      const buffer = await parseResponse(response);
      expect(buffer.length).toBeGreaterThan(0);

      const text = await readPdfText({ data: new Uint8Array(buffer), options: { verbosity: 0 } });
      expect(text).toContain("This is a minimal direktorat PDF");

      writeFileSync(paths.temp.direktoratMinimal, buffer);
    },
  );
}
