// The generated brief (promptShell() in adapters.ts, packageToText() in
// generator.ts) is a small, closed format: "## Title" section headings,
// plain paragraph lines, and "- " bullet lines, sections separated by a
// blank line. Nothing else — no nested lists, no bold/italic, no links,
// no code blocks, no tables. That's small enough to parse deterministically
// without a markdown library, so the Result screen can render it as
// ordinary site typography instead of raw markdown source, while the
// exact same string keeps working everywhere it already does (Copy,
// the .md download, the engine-room package view).
//
// Every block below becomes a real React element wherever it's rendered —
// never dangerouslySetInnerHTML — so nothing a person typed into their own
// creation (the one place user-authored text enters this string) can ever
// become executable HTML. Worst case a stray "## " or "- " at the start of
// one of their own lines renders as a heading/bullet instead of a
// paragraph — a cosmetic quirk, not a security issue, and no different
// from how the same text already displayed unformatted before this.

export type BriefBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] };

export function parseBriefBlocks(text: string): BriefBlock[] {
  const blocks: BriefBlock[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ kind: "heading", text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push({ kind: "bullets", items });
      continue;
    }
    blocks.push({ kind: "paragraph", text: line.trim() });
    i++;
  }
  return blocks;
}
