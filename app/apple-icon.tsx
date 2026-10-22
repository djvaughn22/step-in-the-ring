import { ImageResponse } from "next/og";

// Apple touch icon — the stepped build mark drawn in shapes (no text/emoji so
// it renders identically everywhere). Generated at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const step = { position: "absolute" as const, bottom: 0, background: "#102C47", border: "5px solid #2BA6FF", borderBottom: "none" };
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#08182B", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 130, height: 130, border: "6px solid #2BA6FF", borderRadius: 28, display: "flex" }}>
          <div style={{ position: "absolute", left: 22, right: 22, top: 22, bottom: 22, display: "flex", borderBottom: "5px solid #2BA6FF" }}>
            <div style={{ ...step, left: 0, width: 32, height: 28 }} />
            <div style={{ ...step, left: 27, width: 32, height: 52 }} />
            <div style={{ ...step, left: 54, width: 20, height: 76 }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
