import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // penting untuk Docker/Coolify
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
