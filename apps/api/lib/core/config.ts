import type { FrameAddScriptTagOptions, PDFOptions } from "puppeteer-core";

export const defaultConfig: Config = {
  basedir: process.cwd(),
  stylesheet: [],
  script: [],
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
export type ConfigWithPort = Config & { port: number };

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
   * Base directory to be served by the file server.
   */
  basedir: string;

  /**
   * List of css files to use for styling.
   *
   * @todo change to `FrameAddStyleTagOptions` (will be a breaking change)
   */
  stylesheet: string[];

  /**
   * Custom css styles.
   */
  css: string;

  /**
   * List of scripts to load into the page.
   *
   * @see https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pageaddscripttagoptions
   */
  script: FrameAddScriptTagOptions[];

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
