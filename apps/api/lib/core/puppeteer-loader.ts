import type { PuppeteerNode } from "puppeteer-core";
import puppeteer from "puppeteer-core";

/**
 * In AWS we have to use puppeteer-core, but locally we have to use puppeteer
 */
export async function loadPuppeteer() {
  const isLocal = process.env.NODE_ENV === "development";
  if (isLocal) {
    const { default: localPuppeteer } = await import(/* @vite-ignore */ "puppeteer");
    return localPuppeteer as unknown as PuppeteerNode;
  } else {
    return puppeteer as PuppeteerNode;
  }
}
