import type { PDFOptions } from "puppeteer-core";

export const defaultConfig: Config = {
  css: "",
  merge_css: false,
  document_title: "",
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
   * Custom CSS. This replaces the default CSS of the chosen template unless `merge_css` is true.
   */
  css: string;

  /**
   * Whether to merge the provided CSS with the chosen template's CSS. If false, only the provided CSS will be used.
   * This is useful if you only want to partially extend the template styles without having to provide a complete set of styles.
   * @default false
   */
  merge_css: boolean;

  /**
   * Name of the HTML Document.
   */
  document_title: string;

  /**
   * Media type to emulate the page with.
   * @default "screen"
   */
  page_media_type: "screen" | "print";

  /**
   * PDF options for Puppeteer.
   *
   * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
   */
  pdf_options: PDFOptions;
}
