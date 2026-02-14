import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/:slug((?!api|_next|list|builder|factory-login|e|soc-stat).*)",
        destination: "/e/:slug",
      },
    ];
  },
  transpilePackages: ["coso-engine", "coso-contract"],
  outputFileTracingIncludes: {
    "/*": ["./data/editions/**", "./data/editions.json"],
    "/api/*": ["./data/editions/**", "./data/editions.json"],
  },
};

export default nextConfig;
