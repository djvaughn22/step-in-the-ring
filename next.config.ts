import type { NextConfig } from "next";

// Private owner surfaces: never cached by a shared cache, never indexed.
// The list must cover every route behind the shared owner gate — the pages
// also set robots noindex in metadata; these headers are the CDN-level layer.
const PRIVATE_HEADERS = [
  { key: "Cache-Control", value: "no-store, private" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const PRIVATE_ROUTES = [
  "/author",
  "/author/:path*",
  "/api/author/:path*",
  "/owner",
  "/owner/:path*",
  "/engines",
  "/engines/:path*",
  "/projects",
  "/projects/:path*",
  "/api/engines/:path*",
];

const nextConfig: NextConfig = {
  async headers() {
    return PRIVATE_ROUTES.map((source) => ({ source, headers: PRIVATE_HEADERS }));
  },
};

export default nextConfig;
