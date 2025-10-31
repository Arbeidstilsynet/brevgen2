import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export const tempDir = path.resolve(__dirname, "temp");
export const baselineDir = path.resolve(__dirname, "baseline");

export const pdfNames = {
  defaultShort: "test-pdf-default-template-short",
  defaultLong: "test-pdf-default-template-long",
  defaultAllOptionals: "test-pdf-default-template-all-optionals",
  custom: "test-pdf-custom-template",
  blank: "test-pdf-blank-template",
} as const;

export const paths = {
  temp: {
    defaultShort: path.join(tempDir, "default-short.pdf"),
    defaultLong: path.join(tempDir, "default-long.pdf"),
    defaultAllOptionals: path.join(tempDir, "default-all-optionals.pdf"),
    custom: path.join(tempDir, "custom.pdf"),
    blank: path.join(tempDir, "blank.pdf"),
  },
  baseline: {
    defaultShort: path.join(baselineDir, pdfNames.defaultShort + ".pdf"),
    defaultLong: path.join(baselineDir, pdfNames.defaultLong + ".pdf"),
    defaultAllOptionals: path.join(baselineDir, pdfNames.defaultAllOptionals + ".pdf"),
    custom: path.join(baselineDir, pdfNames.custom + ".pdf"),
    blank: path.join(baselineDir, pdfNames.blank + ".pdf"),
  },
} as const;

if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}
