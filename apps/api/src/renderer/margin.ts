import type { PDFOptions } from "puppeteer-core";

/**
 * Get a margin object from a CSS-like margin string.
 */
export const getMarginObject = (margin: string): PDFOptions["margin"] => {
  if (typeof margin !== "string") {
    throw new TypeError(`margin needs to be a string.`);
  }

  const [top, right, bottom, left, ...remaining] = margin.split(" ");

  if (remaining.length > 0) {
    throw new Error(`invalid margin input "${margin}": can have max 4 values.`);
  }

  if (left) {
    return { top, right, bottom, left };
  }
  if (bottom) {
    return { top, right, bottom, left: right };
  }
  if (right) {
    return { top, right, bottom: top, left: right };
  }
  if (top) {
    return { top, right: top, bottom: top, left: top };
  }
  return undefined;
};
