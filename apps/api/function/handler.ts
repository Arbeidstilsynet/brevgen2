import { parseDynamicMd, ParseDynamicMdOptions } from "@at/dynamic-markdown";
import { generatePdf, GeneratePdfOptions } from "../lib";

export type HandlerGeneratePdfArgs = {
  md: string;
  mdVariables: ParseDynamicMdOptions["variables"];
  options?: GeneratePdfOptions;
};

export async function handlerGeneratePdf({
  md: input,
  mdVariables,
  options,
}: HandlerGeneratePdfArgs) {
  const md = parseDynamicMd(input, { variables: mdVariables });

  const DEBUG = false;
  if (DEBUG) {
    process.env.DEBUG = "1";
  }

  const debugOptions = {
    document_title: "Hello, world",
    dynamic: {
      template: "custom",
    },
    pdf_options: {
      displayHeaderFooter: true,
      format: "a4",
    },
  } as const satisfies GeneratePdfOptions;

  const pdf = await generatePdf(md, DEBUG ? debugOptions : options);
  return pdf.content.toString("base64");
}
