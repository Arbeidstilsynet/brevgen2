import { Browser } from "puppeteer-core";
import { Config } from "./config";
import { generateOutput } from "./generate-output";
import { getHtml } from "./get-html";
import { getMarginObject } from "./helpers";

/**
 * Convert markdown to pdf.
 */
export const convertMdToPdf = async (md: string, config: Config, browser?: Browser) => {
  const { headerTemplate, footerTemplate, displayHeaderFooter } = config.pdf_options;

  if ((headerTemplate || footerTemplate) && displayHeaderFooter === undefined) {
    config.pdf_options.displayHeaderFooter = true;
  }

  const arrayOptions = ["body_class", "script", "stylesheet"] as const;

  // sanitize frontmatter array options
  for (const option of arrayOptions) {
    if (!Array.isArray(config[option])) {
      config[option] = [config[option]].filter(Boolean);
    }
  }

  // sanitize the margin in pdf_options
  if (typeof config.pdf_options.margin === "string") {
    config.pdf_options.margin = getMarginObject(config.pdf_options.margin);
  }

  config.stylesheet = [...new Set([...config.stylesheet])];

  const html = getHtml(md, config);
  const output = await generateOutput(html, config, browser);

  if (!output) {
    if (config.devtools) {
      throw new Error("No file is generated with --devtools.");
    }

    throw new Error(`Failed to create ${config.as_html ? "HTML" : "PDF"}.`);
  }

  return output;
};
