import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    reporters: ["default", "junit"],
    outputFile: "junit.xml",
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
});
