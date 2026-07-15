import type { MetadataRoute } from "next";

// Installable-app manifest — part of app-store readiness (PWA first;
// Capacitor/TWA wrappers come later, same assets).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Step In The Ring",
    short_name: "The Ring",
    description:
      "Say a rough idea in your own words, walk out with a plan for version one — then build it, test it locally, and push it live.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    icons: [
      { src: "/icons/ring-512.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/ring-512-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
