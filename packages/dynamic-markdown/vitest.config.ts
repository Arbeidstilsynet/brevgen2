/// <reference types="vitest" />
import { defineConfig } from "vite";

// override vite config to prevent ESlint from running in tests
export default defineConfig({
  test: {},
});
