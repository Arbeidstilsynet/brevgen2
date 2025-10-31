import { defineConfig } from "tsup";

export default defineConfig({
  outDir: "dist",
  outExtension: ({ format }) => ({ js: format === "esm" ? ".mjs" : ".cjs" }),
  target: "node24",
  format: "cjs",
  sourcemap: true,
  minify: false,
  bundle: true,
  splitting: false,
  dts: false,
  external: [
    "@sparticuz/chromium",
    "@fastify/swagger-ui", // Must be external - needs static assets for Swagger UI
  ],
  noExternal: [/.*/], // Bundle everything except what's in external
});
