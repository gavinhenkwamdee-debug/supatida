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
  // /thewishnote is "The Wish Note" — the custom ring collection's own
  // name, used as a nicer marketing/share URL for /custom-rings. A rewrite
  // (not a redirect) so the URL bar keeps showing /thewishnote while the
  // existing /custom-rings route still works unchanged for every internal
  // link (nav, homepage, admin).
  async rewrites() {
    return [
      { source: "/thewishnote", destination: "/custom-rings" },
      { source: "/thewishnote/:path*", destination: "/custom-rings/:path*" },
    ];
  },
};

export default nextConfig;
