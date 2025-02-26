import { MarkedExtension, MarkedOptions } from "marked";
import type { FrameAddScriptTagOptions, LaunchOptions, PDFOptions } from "puppeteer-core";

export const defaultConfig: Config = {
  basedir: process.cwd(),
  stylesheet: [],
  script: [],
  css: "",
  document_title: "",
  body_class: [],
  page_media_type: "screen",
  marked_options: {},
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
  launch_options: {},
  as_html: false,
  devtools: false,
  marked_extensions: [],
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
   * Options for the Marked parser.
   *
   * @see https://marked.js.org/#/USING_ADVANCED.md
   */
  marked_options: MarkedOptions;

  /**
   * PDF options for Puppeteer.
   *
   * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
   */
  pdf_options: PDFOptions;

  /**
   * Launch options for Puppeteer.
   *
   * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions
   */
  launch_options: LaunchOptions;

  /**
   * If true, open chromium with devtools instead of saving the pdf. This is
   * meant for development only, to inspect the rendered HTML.
   */
  devtools: boolean;

  /**
   * Port to run the local server on.
   */
  port?: number;

  /**
   * Custm Extensions to be passed to marked.
   *
   * @see https://marked.js.org/using_pro#extensions
   */
  marked_extensions: MarkedExtension[];
}
