// FIRST VERSION CUTTER — pure logic, no network, no AI.
//
// A person lists everything their idea could do, then sorts each line into
// now / later / not doing. This file turns that into a first-version scope
// they can copy or carry into the idea box. It never invents a feature: every
// line in the output is one the person typed.

export type Bucket = "now" | "later" | "never";

export interface CutItem {
  id: string;
  text: string;
  bucket: Bucket | null;
}

export interface CutterState {
  idea: string;
  doneMeans: string;
  items: CutItem[];
}

export const EMPTY_CUTTER: CutterState = { idea: "", doneMeans: "", items: [] };

export const MAX_ITEMS = 40;
const MAX_LINE = 160;

/** Bullets, numbers and checkboxes people paste in from other apps. */
const LEADING_MARK = /^\s*(?:[-*•·–]|\d+[.)]|\[[ xX]?\])\s*/;

/** One feature per line, cleaned, de-duplicated (case-insensitive), capped. */
export function parseFeatures(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(LEADING_MARK, "").replace(/\s+/g, " ").trim().slice(0, MAX_LINE);
    if (!line) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

/** Add new lines to the list without disturbing ones already sorted. */
export function addFeatures(items: CutItem[], text: string, makeId: () => string): CutItem[] {
  const existing = new Set(items.map((i) => i.text.toLowerCase()));
  const fresh = parseFeatures(text)
    .filter((t) => !existing.has(t.toLowerCase()))
    .map((t) => ({ id: makeId(), text: t, bucket: null }));
  return [...items, ...fresh].slice(0, MAX_ITEMS);
}

export function inBucket(items: CutItem[], bucket: Bucket | null): CutItem[] {
  return items.filter((i) => i.bucket === bucket);
}

/**
 * Plain advice about the cut. Each note is about the person's own list —
 * counts and gaps — never a claim about anyone else's projects.
 */
export function cutAdvice(state: CutterState): string[] {
  const notes: string[] = [];
  if (state.items.length === 0) return notes;
  const now = inBucket(state.items, "now").length;
  const unsorted = inBucket(state.items, null).length;
  if (unsorted > 0) notes.push(`${unsorted} still to sort.`);
  if (now === 0 && unsorted === 0) {
    notes.push("Nothing is in “now” yet. Pick the one thing that has to work for this to be worth using.");
  }
  if (now > 5) {
    notes.push(
      `${now} things are in “now”. A first version is much easier to finish with three to five. Move the ones you could live without to “later”.`,
    );
  }
  if (!state.doneMeans.trim() && now > 0) {
    notes.push("Add one sentence for “done means” so you know when to stop.");
  }
  return notes;
}

export const BUCKET_LABEL: Record<Bucket, string> = {
  now: "Build now",
  later: "Later",
  never: "Not doing",
};

/** The copyable scope. Only the person's own words, grouped. */
export function scopeText(state: CutterState): string {
  const title = state.idea.trim() || "My idea";
  const lines: string[] = [`First version: ${title}`];
  if (state.doneMeans.trim()) lines.push(`Done means: ${state.doneMeans.trim()}`);
  for (const bucket of ["now", "later", "never"] as Bucket[]) {
    const list = inBucket(state.items, bucket);
    lines.push("", `${BUCKET_LABEL[bucket]} (${list.length})`);
    if (list.length === 0) lines.push("- (nothing yet)");
    for (const item of list) lines.push(`- ${item.text}`);
  }
  return lines.join("\n");
}

/**
 * The sentence handed to the idea box: the idea plus only the "now" items,
 * so the plan that comes back is for the small version, not the dream.
 */
export function ideaBoxHandoff(state: CutterState): string {
  const now = inBucket(state.items, "now").map((i) => i.text);
  const parts: string[] = [];
  if (state.idea.trim()) parts.push(state.idea.trim());
  if (now.length) parts.push(`First version only: ${now.join("; ")}.`);
  if (state.doneMeans.trim()) parts.push(`Done means: ${state.doneMeans.trim()}`);
  return parts.join(" ").slice(0, 1500);
}

/** Safe parse for saved state; anything malformed starts fresh. */
export function parseCutterState(raw: unknown): CutterState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.items)) return null;
  const items: CutItem[] = [];
  for (const it of r.items.slice(0, MAX_ITEMS)) {
    if (!it || typeof it !== "object") continue;
    const i = it as Record<string, unknown>;
    if (typeof i.id !== "string" || typeof i.text !== "string") continue;
    const bucket = i.bucket === "now" || i.bucket === "later" || i.bucket === "never" ? i.bucket : null;
    items.push({ id: i.id, text: i.text.slice(0, MAX_LINE), bucket });
  }
  return {
    idea: typeof r.idea === "string" ? r.idea.slice(0, 300) : "",
    doneMeans: typeof r.doneMeans === "string" ? r.doneMeans.slice(0, 300) : "",
    items,
  };
}
