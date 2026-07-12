import { ImageResponse } from "next/og";

// Apple touch icon — the flat ring mark drawn in shapes (no text/emoji so it
// renders identically everywhere). Generated at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const post = {
    position: "absolute" as const,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#60A5FA",
  };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0b1220",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 116,
            height: 116,
            background: "#141d2e",
            border: "6px solid #60A5FA",
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              border: "3px solid #3a5a80",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 54, height: 54, border: "3px solid #26324c", borderRadius: 10, display: "flex" }} />
          </div>
          <div style={{ ...post, top: -12, left: -12 }} />
          <div style={{ ...post, top: -12, right: -12 }} />
          <div style={{ ...post, bottom: -12, left: -12 }} />
          <div style={{ ...post, bottom: -12, right: -12 }} />
        </div>
      </div>
    ),
    size,
  );
}
