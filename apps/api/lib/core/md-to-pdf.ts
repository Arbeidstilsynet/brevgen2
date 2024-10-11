import grayMatter from "gray-matter";
import { Browser } from "puppeteer-core";
import { Config } from "./config";
import { generateOutput } from "./generate-output";
import { getHtml } from "./get-html";
import { getMarginObject } from "./helpers";

/**
 * Convert markdown to pdf.
 */
export const convertMdToPdf = async (
  input: { content: string },
  config: Config,
  {
    browser,
  }: {
    browser?: Browser;
  } = {},
) => {
  const { content: md, data: frontMatterConfig } = grayMatter(
    input.content,
    config.gray_matter_options,
  );

  // merge front-matter config
  if (frontMatterConfig instanceof Error) {
    console.warn(
      "Warning: the front-matter was ignored because it could not be parsed:\n",
      frontMatterConfig,
    );
  } else {
    config = {
      ...config,
      ...(frontMatterConfig as Config),
      pdf_options: { ...config.pdf_options, ...frontMatterConfig.pdf_options },
    };
  }

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
