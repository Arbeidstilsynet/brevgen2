import { readFileSync } from "node:fs";
import { comparePdfToSnapshot } from "pdf-visual-diff";
import { expect, test } from "vitest";
import { paths, pdfNames } from "../paths";

export function visualTests() {
  test("pdf-visual-diff (custom template)", { timeout: 10_000 }, async () => {
    const pdfName = pdfNames.custom;
    const pdf = readFileSync(paths.temp.custom);

    const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
      tolerance: 0.05,
    });
    expect(matched).toBe(true);
  });

  test("pdf-visual-diff (blank template)", { timeout: 10_000 }, async () => {
    const pdfName = pdfNames.blank;
    const pdf = readFileSync(paths.temp.blank);

    const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
      tolerance: 0.05,
    });
    expect(matched).toBe(true);
  });

  test("pdf-visual-diff (default template, short)", { timeout: 10_000 }, async () => {
    const pdfName = pdfNames.defaultShort;
    const pdf = readFileSync(paths.temp.defaultShort);

    const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
      tolerance: 0.05,
    });
    expect(matched).toBe(true);
  });

  test("pdf-visual-diff (default template, long)", { timeout: 20_000 }, async () => {
    const pdfName = pdfNames.defaultLong;
    const pdf = readFileSync(paths.temp.defaultLong);

    const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
      tolerance: 0.05,
    });
    expect(matched).toBe(true);
  });

  test("pdf-visual-diff (default template, all optionals)", { timeout: 10_000 }, async () => {
    const pdfName = pdfNames.defaultAllOptionals;
    const pdf = readFileSync(paths.temp.defaultAllOptionals);

    const matched = await comparePdfToSnapshot(pdf, __dirname, pdfName, {
      tolerance: 0.05,
    });
    expect(matched).toBe(true);
  });
}
