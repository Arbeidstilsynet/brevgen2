import fs from "fs";
import path from "path";
import { logger } from "../../app";

/**
 * Load all fonts for Chromium in given directory
 */
async function loadFonts(chromium: typeof import("@sparticuz/chromium"), fontDir: string) {
  if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    throw new Error("@sparticuz/chromium is not available outside of AWS Lambda");
  }

  const fontFiles = fs.readdirSync(fontDir).filter((file) => file.endsWith(".ttf"));
  for (const fontFile of fontFiles) {
    const fontPath = path.join(fontDir, fontFile);
    await chromium.font(fontPath);
  }
  logger.info({ fontFiles }, "Loaded fonts");
}

export async function configureLambdaChromium(chromium: typeof import("@sparticuz/chromium")) {
  if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    throw new Error("@sparticuz/chromium is not available outside of AWS Lambda");
  }

  chromium.setGraphicsMode = false;

  await loadFonts(chromium, path.join(__dirname, "fonts"));
}
