import type { NextConfig } from "next";
import path from "path";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080"
).trim().replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Pin the workspace root explicitly: a stray package-lock.json in the
  // parent D:\IFMS_FE directory makes Turbopack infer that as the root,
  // which breaks module resolution ("Could not find the module ... in the
  // React Client Manifest").
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
