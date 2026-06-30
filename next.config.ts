import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from /uploads (local) without extra config
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
