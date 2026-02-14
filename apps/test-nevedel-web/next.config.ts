import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["coso-nevedel-core"],
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "coso-nevedel-core": path.resolve(__dirname, "../../packages/coso-nevedel-core/src/index.ts"),
    };
    return config;
  },
};

export default nextConfig;
