// Builder Defaults — how this creator's builds actually run.
//
// A local, editable profile folded into every generated prompt. Not a
// biography: no names, no private paths, no secrets. Stored on this device
// only, versioned, safe-parsed.

import type { SoftwareVerdict } from "./types";

export interface BuilderDefaults {
  version: 1;
  /** Where the work lands. */
  workMode: "new-standalone" | "existing-repo";
  /** How far the builder is allowed to go. */
  gitMode: "prototype" | "build-commit" | "build-commit-push";
  /** One repository at a time unless a prompt explicitly authorises more. */
  singleRepo: boolean;
  /** Free-text extras the creator wants in every prompt. */
  notes: string;
}

export const DEFAULT_BUILDER_DEFAULTS: BuilderDefaults = {
  version: 1,
  workMode: "new-standalone",
  gitMode: "build-commit",
  singleRepo: true,
  notes: "",
};

const KEY = "sitr-builder-defaults-v1";

export function loadBuilderDefaults(): BuilderDefaults {
  if (typeof window === "undefined") return DEFAULT_BUILDER_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BUILDER_DEFAULTS;
    const p = JSON.parse(raw) as Partial<BuilderDefaults>;
    return {
      version: 1,
      workMode: p.workMode === "existing-repo" ? "existing-repo" : "new-standalone",
      gitMode: p.gitMode === "prototype" || p.gitMode === "build-commit-push" ? p.gitMode : "build-commit",
      singleRepo: p.singleRepo !== false,
      notes: typeof p.notes === "string" ? p.notes.slice(0, 500) : "",
    };
  } catch {
    return DEFAULT_BUILDER_DEFAULTS;
  }
}

export function saveBuilderDefaults(d: BuilderDefaults): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(d));
  } catch {}
}

/* ── The working method, as prompt lines ─────────────────────────────────
   This is the real low-cost workflow, stated once and reused by every
   engine's prompt adapter. Software-specific practice (an existing
   codebase, mobile-first UI, git commits, type checking) only belongs here
   when software is actually the deliverable — a song, a poem, or a letter
   has its own definition of done and gets none of it. The type/verdict
   system already knows the difference (`SoftwareVerdict` on every
   `CreationView`); this just has to ask it before writing repo language
   into a music brief. */

export function doctrineLines(d: BuilderDefaults, verdict: SoftwareVerdict): string[] {
  if (verdict !== "central") return generalDoctrineLines(d);
  const lines = [
    "Use the simplest stack that does the job; keep the implementation in as few files as practical.",
    "Mobile-first: essential actions reachable on a narrow phone, touch targets big enough for a thumb.",
    "Mouse, touch, and keyboard all work; visible focus; real labels; announce state changes to screen readers; respect reduced motion.",
    "No paid services, and no databases, accounts, AI APIs, analytics, or third-party services unless the brief explicitly requires them.",
    "Run the real thing and use the changed flow yourself before calling it done.",
    "Run type checking, tests, and the production build; review the complete diff; remove debug artifacts.",
  ];
  if (d.workMode === "existing-repo") {
    lines.unshift(
      "Inspect before editing: record branch, commit, and working-tree state; preserve unrelated work; follow the existing architecture where it is sound.",
    );
  } else {
    lines.unshift("Start clean — do not assume access to any existing codebase.");
  }
  if (d.singleRepo) {
    lines.push("Work in ONE repository only unless this prompt explicitly authorises a coordinated cross-repository task.");
  }
  switch (d.gitMode) {
    case "prototype":
      lines.push("Prototype only: do not commit. Show the result working and stop.");
      break;
    case "build-commit":
      lines.push("Commit only intended files, in one clear commit, after checks pass. Do not push.");
      break;
    case "build-commit-push":
      lines.push("Commit only intended files after checks pass, then push to the existing remote branch. Do not manually deploy.");
      break;
  }
  lines.push(
    "Stop only for destructive, security-sensitive, paid, data-loss, or irreversible actions — otherwise complete the work without routine approval.",
    "Finish with a concise, honest report: what was built, what was verified, what was assumed, what was not done.",
  );
  if (d.notes.trim()) lines.push(d.notes.trim());
  return lines;
}

/**
 * The same working method, for every creation where software is NOT the
 * deliverable (`SoftwareVerdict` other than "central") — a song, a poem, a
 * letter, a physical product, a real-world plan. No codebase, no mobile-
 * first UI, no git, no type checking: none of that applies to a finished
 * song or a written page. What's genuinely universal survives, reworded
 * away from software vocabulary.
 */
function generalDoctrineLines(d: BuilderDefaults): string[] {
  const lines = [
    "Use the simplest approach that actually finishes the real thing — nothing this doesn't need.",
    "No paid tools or AI services unless this explicitly requires them.",
    "Use or experience the finished piece yourself before calling it done.",
    "Stop only for destructive, costly, or hard-to-reverse choices — otherwise keep going without routine approval.",
    "Finish with a concise, honest account: what was made, what was checked, what was assumed, what wasn't done.",
  ];
  if (d.notes.trim()) lines.push(d.notes.trim());
  return lines;
}
