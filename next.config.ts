import type { NextConfig } from "next";

// The Author's Room is private: never cached by a shared cache, never indexed.
const PRIVATE_HEADERS = [
  { key: "Cache-Control", value: "no-store, private" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/author", headers: PRIVATE_HEADERS },
      { source: "/author/:path*", headers: PRIVATE_HEADERS },
      { source: "/api/author/:path*", headers: PRIVATE_HEADERS },
    ];
  },
};

export default nextConfig;
