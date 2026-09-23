import type { NextConfig } from "next";
import path from "path";

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
        destination: `${process.env.NEXT_PUBLIC_API_URL || "https://ifms-production.up.railway.app/"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
