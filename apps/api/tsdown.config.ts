import { defineConfig } from "tsdown";

export default defineConfig({
  outDir: "dist",
  format: "esm",
  sourcemap: true,
  minify: false,
  dts: false,
  shims: true,
  deps: {
    // Workspace packages export TypeScript source directly; third-party deps are
    // loaded from node_modules produced by `pnpm deploy --prod` so image scanners
    // (Trivy / Dependency-Track) can inventory them.
    alwaysBundle: [/^@at\//, /^@repo\//],
  },
});
