import { defineConfig } from "tsdown";

export default defineConfig({
  outDir: "dist",
  format: "esm",
  sourcemap: true,
  minify: false,
  dts: false,
  shims: true,
  deps: {
    onlyBundle: false,
    alwaysBundle: [/.*/],
  },
});
