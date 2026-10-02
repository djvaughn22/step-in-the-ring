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
  // The /engines directory itself is public and the same for everyone, so
  // it is allowed in search. The Engine Room below it is not.
  "/engines/:path*",
  "/projects",
  "/projects/:path*",
  "/api/engines/:path*",
  // Member account surfaces: personal, never cached, never indexed. The
  // public /membership page is deliberately NOT here.
  "/account",
  "/account/:path*",
  "/api/members/:path*",
  "/api/owner/:path*",
];

// Digital Front Desk moved to iDontCry Dream Labs on Sep 30 2026. This repo
// no longer holds any of its pages, API routes or request data; every old
// page link lands on the matching page of the one canonical product. The old
// /api/uat/digital-front-desk/* routes are simply gone (404), so nothing on
// this site stores or returns front-desk requests any more. Temporary (307)
// while the product is still a demo.
const IDC_DFD = "https://idontcry.com/digital-front-desk";
export const DIGITAL_FRONT_DESK_REDIRECTS = [
  { source: "/uat/digital-front-desk", destination: IDC_DFD, permanent: false },
  { source: "/uat/digital-front-desk/request", destination: `${IDC_DFD}/request`, permanent: false },
  { source: "/uat/digital-front-desk/desk", destination: `${IDC_DFD}/desk`, permanent: false },
  { source: "/uat/digital-front-desk/onboarding", destination: `${IDC_DFD}/onboarding`, permanent: false },
  { source: "/uat/digital-front-desk/admin", destination: `${IDC_DFD}/admin`, permanent: false },
  { source: "/uat/digital-front-desk/:path*", destination: IDC_DFD, permanent: false },
];

// Usefulness-first (Oct 1 2026): nothing is sold on this site. The paid
// Sprint service pages, its application form and the shop preview are gone;
// their old links land on the closest free thing instead of a 404.
export const RETIRED_SALES_REDIRECTS = [
  { source: "/products/five-hour-sprint", destination: "/five-hour-sprint-tool", permanent: false },
  { source: "/products/five-hour-sprint/:path*", destination: "/five-hour-sprint-tool", permanent: false },
  { source: "/shop", destination: "/tools", permanent: false },
];

const nextConfig: NextConfig = {
  async headers() {
    return PRIVATE_ROUTES.map((source) => ({ source, headers: PRIVATE_HEADERS }));
  },
  async redirects() {
    return [...DIGITAL_FRONT_DESK_REDIRECTS, ...RETIRED_SALES_REDIRECTS];
  },
};

export default nextConfig;
