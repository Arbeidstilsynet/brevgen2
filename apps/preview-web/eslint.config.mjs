// @ts-check

import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "coverage/",
    // Default ignores of eslint-config-next:
    ".next/",
    "out/",
    "build/",
    "next-env.d.ts",
  ]),

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  ...nextVitals,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  ...nextTs,

  {
    rules: {
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          // ESLint klager på vanlig bruk av async event handlers i React selv om de returnerer Promise<void>
          checksVoidReturn: false,
        },
      ],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
