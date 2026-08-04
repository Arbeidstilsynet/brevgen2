import { PDFDocument } from "pdf-lib";
import type { Browser } from "puppeteer-core";
import type { Config } from "./config";
import { BROWSER_CLOSE_TIMEOUT_MS, PUPPETEER_OPERATION_TIMEOUT_MS, withTimeout } from "./helpers";
import { InferOutputType } from "./types";

/**
 * Generate the output (either PDF or HTML) based on config.
 */
export async function generateOutput<T extends Config>(
  html: string,
  config: T,
  browser: Browser,
): Promise<InferOutputType<T>> {
  const page = await withTimeout(
    browser.newPage(),
    PUPPETEER_OPERATION_TIMEOUT_MS,
    "Creating browser page",
  );

  try {
    await page.goto("about:blank", { timeout: PUPPETEER_OPERATION_TIMEOUT_MS });
    await page.setContent(html, {
      timeout: PUPPETEER_OPERATION_TIMEOUT_MS,
      waitUntil: "domcontentloaded",
    });

    if (config.css) {
      await withTimeout(
        page.addStyleTag({ content: config.css }),
        PUPPETEER_OPERATION_TIMEOUT_MS,
        "Adding page styles",
      );
    }

    let outputFileContent: string | Buffer = "";

    if (config.as_html) {
      outputFileContent = await withTimeout(
        page.content(),
        PUPPETEER_OPERATION_TIMEOUT_MS,
        "Reading page content",
      );
    } else {
      await withTimeout(
        page.emulateMediaType(config.page_media_type),
        PUPPETEER_OPERATION_TIMEOUT_MS,
        "Setting page media type",
      );
      const pdfTimeoutMs = config.pdf_options.timeout ?? PUPPETEER_OPERATION_TIMEOUT_MS;
      const pdfBytes = await withTimeout(
        page.pdf(config.pdf_options),
        pdfTimeoutMs,
        "Generating PDF",
      );
      const pdfDoc = await withTimeout(
        PDFDocument.load(pdfBytes),
        PUPPETEER_OPERATION_TIMEOUT_MS,
        "Loading generated PDF",
      );
      if (config.author) {
        pdfDoc.setAuthor(config.author);
      }
      const newPdfBytes = await withTimeout(
        pdfDoc.save(),
        PUPPETEER_OPERATION_TIMEOUT_MS,
        "Saving generated PDF",
      );
      outputFileContent = Buffer.from(newPdfBytes);
    }

    return {
      content: outputFileContent,
    } as InferOutputType<T>;
  } finally {
    await withTimeout(page.close(), BROWSER_CLOSE_TIMEOUT_MS, "Closing browser page");
  }
}
