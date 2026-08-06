import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
    useTypeScriptCli: true,
  },
};

export default nextConfig;
