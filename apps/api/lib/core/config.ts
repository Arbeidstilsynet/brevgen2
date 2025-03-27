import type { PDFOptions } from "puppeteer-core";

export const defaultConfig: Config = {
  css: "",
  document_title: "",
  body_class: [],
  page_media_type: "screen",
  pdf_options: {
    printBackground: true,
    format: "a4",
    margin: {
      top: "30mm",
      right: "40mm",
      bottom: "30mm",
      left: "20mm",
    },
  },
  as_html: false,
};

/**
 * In config keys, dashes of cli flag names are replaced with underscores.
 */
export type Config = PdfConfig | HtmlConfig;

export interface PdfConfig extends BasicConfig {
  /**
   * If true, generate HTML output instead of PDF output. Default: `false`.
   */
  as_html?: false;

  /**
   * Author metadata
   */
  author?: string;
}

export interface HtmlConfig extends BasicConfig {
  /**
   * If true, generate HTML output instead of PDF output. Default: `false`.
   */
  as_html: true;
}

interface BasicConfig {
  /**
   * Custom css styles.
   */
  css: string;

  /**
   * Name of the HTML Document.
   */
  document_title: string;

  /**
   * List of classes for the body tag.
   */
  body_class: string[];

  /**
   * Media type to emulate the page with.
   */
  page_media_type: "screen" | "print";

  /**
   * PDF options for Puppeteer.
   *
   * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
   */
  pdf_options: PDFOptions;
}
