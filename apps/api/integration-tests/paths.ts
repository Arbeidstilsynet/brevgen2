import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export const tempDir = path.resolve(__dirname, "temp");
export const baselineDir = path.resolve(__dirname, "baseline");

export const pdfNames = {
  defaultShort: "test-pdf-default-template-short",
  defaultLong: "test-pdf-default-template-long",
  defaultAllOptionals: "test-pdf-default-template-all-optionals",
  direktoratShort: "test-pdf-direktorat-template-short",
  direktoratWithSignatures: "test-pdf-direktorat-template-with-signatures",
  direktoratMinimal: "test-pdf-direktorat-template-minimal",
  custom: "test-pdf-custom-template",
  blank: "test-pdf-blank-template",
} as const;

export const paths = {
  temp: {
    defaultShort: path.join(tempDir, pdfNames.defaultShort + ".pdf"),
    defaultLong: path.join(tempDir, pdfNames.defaultLong + ".pdf"),
    defaultAllOptionals: path.join(tempDir, pdfNames.defaultAllOptionals + ".pdf"),
    direktoratShort: path.join(tempDir, pdfNames.direktoratShort + ".pdf"),
    direktoratWithSignatures: path.join(tempDir, pdfNames.direktoratWithSignatures + ".pdf"),
    direktoratMinimal: path.join(tempDir, pdfNames.direktoratMinimal + ".pdf"),
    custom: path.join(tempDir, pdfNames.custom + ".pdf"),
    blank: path.join(tempDir, pdfNames.blank + ".pdf"),
  },
  baseline: {
    defaultShort: path.join(baselineDir, pdfNames.defaultShort + ".pdf"),
    defaultLong: path.join(baselineDir, pdfNames.defaultLong + ".pdf"),
    defaultAllOptionals: path.join(baselineDir, pdfNames.defaultAllOptionals + ".pdf"),
    direktoratShort: path.join(baselineDir, pdfNames.direktoratShort + ".pdf"),
    direktoratWithSignatures: path.join(baselineDir, pdfNames.direktoratWithSignatures + ".pdf"),
    direktoratMinimal: path.join(baselineDir, pdfNames.direktoratMinimal + ".pdf"),
    custom: path.join(baselineDir, pdfNames.custom + ".pdf"),
    blank: path.join(baselineDir, pdfNames.blank + ".pdf"),
  },
} as const;

if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}
