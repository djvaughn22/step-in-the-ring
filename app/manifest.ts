import type { MetadataRoute } from "next";
import { BRAND_ONE_LINE } from "./site/brand";

// Installable-app manifest — part of app-store readiness (PWA first;
// Capacitor/TWA wrappers come later, same assets).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Step In The Ring",
    short_name: "Step In The Ring",
    description: BRAND_ONE_LINE,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08182B",
    theme_color: "#08182B",
    icons: [
      { src: "/icons/ring-512.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/ring-512-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
