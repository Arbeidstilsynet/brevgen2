// @ts-check

import js from "@eslint/js";
// @ts-expect-error Could not find a declaration file
import nextVitals from "eslint-config-next/core-web-vitals";
// @ts-expect-error Could not find a declaration file
import nextTs from "eslint-config-next/typescript";
import reactCompiler from "eslint-plugin-react-compiler";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  ...nextVitals,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  ...nextTs,

  globalIgnores([
    "coverage/**",
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

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
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
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
