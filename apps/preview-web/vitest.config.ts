import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default", "junit"],
    outputFile: "junit.xml",
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        // Exclude Next.js specific files
        "next.config.*",
        "middleware.ts",
        // Exclude NextAuth
        "auth.ts",
        "pages/api/auth/*",
        // Exclude config files
        "*.config.*",
      ],
      include: ["**/*.{ts,tsx}"],
    },
  },
});
