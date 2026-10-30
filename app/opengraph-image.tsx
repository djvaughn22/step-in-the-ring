// Share preview for every page that doesn't set its own: 1200×630 PNG,
// in the site's own colors (globals.css --bg, --text, --muted, --accent).

import { ImageResponse } from "next/og";

export const alt = "Step In The Ring: bring your idea to life";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#08182B";
const TEXT = "#EAF1F8";
const MUTED = "#9DB2C6";
const ACCENT = "#2BA6FF";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: BG,
          color: TEXT,
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ width: 140, height: 10, borderRadius: 5, background: ACCENT, display: "flex" }} />
        <div style={{ marginTop: 36, fontSize: 30, letterSpacing: 6, color: MUTED, display: "flex" }}>
          STEPINTHERING.COM
        </div>
        <div style={{ marginTop: 20, fontSize: 84, lineHeight: 1.08, display: "flex", flexWrap: "wrap" }}>
          <span>Bring your idea&nbsp;</span>
          <span style={{ color: ACCENT }}>to life.</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: MUTED, lineHeight: 1.35, display: "flex" }}>
          Plan, write, and build your next digital product or creative project, one clear step at a time.
        </div>
      </div>
    ),
    size,
  );
}
