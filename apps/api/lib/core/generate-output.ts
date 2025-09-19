import { PDFDocument } from "pdf-lib";
import type { Browser } from "puppeteer-core";
import type { Config } from "./config";
import { InferOutputType } from "./types";

/**
 * Generate the output (either PDF or HTML) based on config.
 */
export async function generateOutput<T extends Config>(
  html: string,
  config: T,
  browser: Browser,
): Promise<InferOutputType<T>> {
  const page = await browser.newPage();

  await page.goto("about:blank");
  await page.setContent(html, { waitUntil: "domcontentloaded" });

  if (config.css) {
    await page.addStyleTag({ content: config.css });
  }

  let outputFileContent: string | Buffer = "";

  if (config.as_html) {
    outputFileContent = await page.content();
  } else {
    await page.emulateMediaType(config.page_media_type);
    const pdfBytes = await page.pdf(config.pdf_options);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    if (config.author) {
      pdfDoc.setAuthor(config.author);
    }
    const newPdfBytes = await pdfDoc.save();
    outputFileContent = Buffer.from(newPdfBytes);
  }

  await page.close();

  return {
    content: outputFileContent,
  } as InferOutputType<T>;
}
