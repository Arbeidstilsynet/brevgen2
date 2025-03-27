import { parseDynamicMd, ParseDynamicMdOptions } from "@at/dynamic-markdown";
import { generateDocument, GenerateDocumentOptions } from "./generate";

export interface HandlerGeneratePdfArgs {
  md: string;
  mdVariables: ParseDynamicMdOptions["variables"];
  options?: GenerateDocumentOptions;
}

/**
 * @returns HTML or Base64-encoded PDF
 */
export async function handlerGeneratePdf({
  md: input,
  mdVariables,
  options,
}: HandlerGeneratePdfArgs) {
  const md = parseDynamicMd(input, { variables: mdVariables });
  const result = await generateDocument(md, options);
  if (typeof result.content === "string") {
    return result.content;
  }
  return result.content.toString("base64");
}
