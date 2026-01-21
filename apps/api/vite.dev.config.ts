import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePluginNode } from "vite-plugin-node";

export default defineConfig({
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 4000,
  },
  plugins: [
    VitePluginNode({
      adapter: "fastify",
      appPath: "./server.dev.ts",
      exportName: "fastify",
      tsCompiler: "esbuild",
    }),
  ],
  define: {
    __dirname: JSON.stringify(path.dirname(fileURLToPath(import.meta.url))),
    __filename: JSON.stringify(fileURLToPath(import.meta.url)),
  },
  optimizeDeps: {
    include: ["puppeteer"],
  },
});
