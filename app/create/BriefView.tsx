"use client";

import { parseBriefBlocks } from "../creation/brief-blocks";

/**
 * Renders a generated brief as ordinary site typography — section labels,
 * paragraphs, bullet lists — instead of raw "## heading" markdown source
 * in a monospace box. Reuses the same `.plan-label` / `.plan-list` classes
 * every other result card on this screen already uses, so this reads as
 * one more part of the page, not a developer console dropped into it.
 *
 * Presentation only: the underlying string (Copy, the .md download) is
 * untouched. Every block is a real React element — never
 * dangerouslySetInnerHTML — so nothing in the text can become HTML.
 */
export default function BriefView({ text }: { text: string }) {
  const blocks = parseBriefBlocks(text);
  return (
    <div className="brief-view">
      {blocks.map((b, i) => {
        if (b.kind === "heading") {
          return (
            <div key={i} className="plan-label" style={{ marginTop: i === 0 ? 0 : 22, marginBottom: 8 }}>
              {b.text}
            </div>
          );
        }
        if (b.kind === "bullets") {
          return (
            <ul key={i} className="plan-list" style={{ marginBottom: 10 }}>
              {b.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.6, margin: "0 0 10px" }}>
            {b.text}
          </p>
        );
      })}
    </div>
  );
}
