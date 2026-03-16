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
  optimizeDeps: {
    include: ["puppeteer"],
  },
});
