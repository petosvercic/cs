import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // dôležité pri "file:" deps / symlink balíkoch mimo projektu,

  // nech bundler korektne spracuje lokálne balíky
  transpilePackages: ["coso-engine", "coso-contract"],
};

export default nextConfig;
