import { defineConfig } from "tsup";

export default defineConfig({
  outDir: "dist",
  outExtension: ({ format }) => ({ js: format === "esm" ? ".mjs" : ".cjs" }),
  target: "node22",
  format: ["cjs"],
  sourcemap: true,
  minify: true,
  bundle: true,
  splitting: false,
  dts: false,
  noExternal: [/^(?!@sparticuz\/chromium$).*/, "puppeteer-core"], // Include all dependencies except @sparticuz/chromium
});
