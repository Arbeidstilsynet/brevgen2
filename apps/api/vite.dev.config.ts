import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { VitePluginNode } from "vite-plugin-node";

export default defineConfig({
  server: {
    port: 4000,
  },
  plugins: [
    VitePluginNode({
      adapter: "express",
      appPath: "./devServer.ts",
      exportName: "app",
      tsCompiler: "esbuild",
    }),
  ],
  define: {
    __dirname: JSON.stringify(path.dirname(fileURLToPath(import.meta.url))),
    __filename: JSON.stringify(fileURLToPath(import.meta.url)),
  },
  build: {
    rollupOptions: {
      output: {
        format: "cjs",
      },
    },
  },
  optimizeDeps: {
    include: ["puppeteer"],
  },
});
