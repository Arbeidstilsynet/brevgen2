import path from "path";
import { defineConfig } from "vite";
import packageJson from "./package.json";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "lib/index.ts"),
      name: packageJson.name,
      fileName: packageJson.name,
    },
  },
});
