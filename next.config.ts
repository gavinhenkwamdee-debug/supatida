import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // /custom-rings was the custom ring collection's URL before it was
  // renamed to its own brand name, /thewishnote (app/thewishnote) — permanent
  // redirect so old links/bookmarks land on the new URL instead of a dead
  // page, and so visiting the old path always shows the new one in the
  // address bar too.
  async redirects() {
    return [
      { source: "/custom-rings", destination: "/thewishnote", permanent: true },
      { source: "/custom-rings/:path*", destination: "/thewishnote/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
