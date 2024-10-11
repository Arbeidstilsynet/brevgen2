import { defaultTemplate } from "@at/document-templates";
type DefaultTemplateFields = defaultTemplate.DefaultTemplateFields;

export { generatePdf, type GeneratePdfOptions } from "./pdf";
export type { DefaultTemplateFields };
