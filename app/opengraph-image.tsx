// Share preview for every page that doesn't set its own: 1200×630 PNG,
// in the site's own colors (globals.css --bg, --text, --muted; amber from home2.css).

import { ImageResponse } from "next/og";

export const alt = "Step In The Ring: get your business online. Without the headache.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#08182B";
const TEXT = "#EAF1F8";
const MUTED = "#9DB2C6";
// The home page's action colour (app/starter/home2.css), 2026-11-12.
const ACT = "#F5B82E";

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
        <div style={{ width: 140, height: 10, borderRadius: 5, background: ACT, display: "flex" }} />
        <div style={{ marginTop: 36, fontSize: 30, letterSpacing: 6, color: MUTED, display: "flex" }}>
          STEPINTHERING.COM
        </div>
        <div style={{ marginTop: 20, fontSize: 84, lineHeight: 1.08, display: "flex", flexWrap: "wrap" }}>
          <span>Get your business online.&nbsp;</span>
          <span style={{ color: ACT }}>Without the headache.</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: MUTED, lineHeight: 1.35, display: "flex" }}>
          A free website builder. Start from an example, make it yours, download the files.
        </div>
      </div>
    ),
    size,
  );
}
