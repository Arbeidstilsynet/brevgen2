import puppeteer from "puppeteer-core";

/**
 * In container we have to use puppeteer-core, but in dev we have to use puppeteer
 */
export async function loadPuppeteer() {
  const isLocal = process.env.NODE_ENV === "development";
  if (isLocal) {
    const { default: localPuppeteer } = await import(/* @vite-ignore */ "puppeteer");
    return localPuppeteer;
  } else {
    return puppeteer;
  }
}
