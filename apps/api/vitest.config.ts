import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default", "junit"],
    outputFile: "junit.xml",
    coverage: {
      exclude: [...coverageConfigDefaults.exclude, "**/server.ts", "**/vite.dev.config.ts"],
    },
  },
});
