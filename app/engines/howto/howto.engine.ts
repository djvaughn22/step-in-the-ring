// How to Anything Engine — pure logic.
//
// Takes ONE proven solution at a time from memory to a complete production
// package: script, shot list, YouTube listing, thumbnail plan, article, and
// social versions. Everything is assembled deterministically from the owner's
// own captured words — no APIs, works offline, same input → same package.
//
// The one rule that gates everything: a guess never becomes a claimed fact.
// An "uncertain" solution cannot generate a package. Prove it first.

export type ProofLevel = "firsthand" | "documented" | "uncertain";

export const PROOF_LEVELS: { id: ProofLevel; label: string; means: string }[] = [
  { id: "firsthand", label: "Firsthand", means: "I did this myself and watched it work." },
  { id: "documented", label: "Documented", means: "I did it AND it matches official documentation." },
  { id: "uncertain", label: "Uncertain", means: "I think this works, but I haven't proven it." },
];

/** One solution, start to finish. Lives in a CreationProject's buildContent. */
export interface SolutionRecord {
  // 1. Remember — the experience, in the owner's words
  name: string;          // working name for the solution
  problem: string;       // what looked broken or confusing
  device: string;        // exact device, product, or situation
  symptoms: string;      // what you could actually see happening
  wrongPaths: string;    // what other people or support got wrong (optional)
  steps: string[];       // the exact steps that worked, in order
  result: string;        // what happened when it worked
  limits: string;        // when this will NOT help (optional but honest)
  story: string;         // extra background worth telling (optional)
  // 2. Prove
  proofLevel: ProofLevel | "";
  proofNote: string;     // how the result was proven
  proofConfirmed: boolean; // "every step above is exactly what happened — no guesses added"
  // 4. Footage — shot ids marked as recorded
  footageDone: string[];
  footageNotes: string;
  // 5. Publish
  videoUrl: string;
  publishedAt: string;
  // 6. Learn — dated, manual, honest numbers
  snapshots: PerformanceSnapshot[];
}

export interface PerformanceSnapshot {
  id: string;
  date: string;       // ISO date
  views: string;      // kept as strings — these are copied from YouTube Studio by hand
  watchTime: string;
  ctr: string;
  notes: string;      // comments, viewer reports, search terms, follow-up topics
}

export function emptyRecord(): SolutionRecord {
  return {
    name: "", problem: "", device: "", symptoms: "", wrongPaths: "",
    steps: [], result: "", limits: "", story: "",
    proofLevel: "", proofNote: "", proofConfirmed: false,
    footageDone: [], footageNotes: "",
    videoUrl: "", publishedAt: "", snapshots: [],
  };
}

/** Old saved records get safe defaults instead of crashes. */
export function parseRecord(raw: unknown): SolutionRecord {
  const base = emptyRecord();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<SolutionRecord>;
  return {
    ...base,
    ...r,
    steps: Array.isArray(r.steps) ? r.steps.filter((s): s is string => typeof s === "string") : [],
    footageDone: Array.isArray(r.footageDone) ? r.footageDone.filter((s): s is string => typeof s === "string") : [],
    snapshots: Array.isArray(r.snapshots) ? (r.snapshots as PerformanceSnapshot[]) : [],
    proofConfirmed: r.proofConfirmed === true,
  };
}

// ---------------------------------------------------------------------------
// Gates
// ---------------------------------------------------------------------------

/** What the capture step still needs before proof review makes sense. */
export function captureGate(r: SolutionRecord): { ready: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!r.name.trim()) missing.push("A working name");
  if (!r.problem.trim()) missing.push("What looked broken or confusing");
  if (!r.device.trim()) missing.push("The exact device, product, or situation");
  if (!r.symptoms.trim()) missing.push("What you could see happening");
  if (r.steps.filter((s) => s.trim()).length === 0) missing.push("At least one step that worked");
  if (!r.result.trim()) missing.push("What happened when it worked");
  return { ready: missing.length === 0, missing };
}

/**
 * The honesty gate. A package only generates for a proven solution:
 * firsthand or documented, with the confirmation checked. "Uncertain" is a
 * hard stop — the engine never converts a guess into a claimed fact.
 */
export function proofGate(r: SolutionRecord): { ready: boolean; missing: string[] } {
  const capture = captureGate(r);
  const missing = [...capture.missing];
  if (!r.proofNote.trim()) missing.push("How the result was proven");
  if (!r.proofLevel) missing.push("A proof level");
  if (r.proofLevel === "uncertain") {
    missing.push("Real proof — an uncertain fix stays in the notebook until you test it again for real");
  }
  if (!r.proofConfirmed) missing.push("The confirmation that every step is exactly what happened");
  return { ready: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// The production package
// ---------------------------------------------------------------------------

export interface Shot {
  id: string;
  label: string;   // what to film
  covers: string;  // which part of the script it covers
}

export interface ScriptSection {
  heading: string;
  voiceover: string;
  shotIds: string[];
}

export interface SolutionPackage {
  titles: string[];
  script: ScriptSection[];
  shotList: Shot[];
  shortScript: string;
  description: string;
  tags: string[];
  pinnedComment: string;
  thumbnail: { text: string; shot: string };
  article: string; // markdown for the Step In The Ring article
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "on", "in", "at", "to", "of", "for",
  "it", "its", "is", "was", "be", "with", "over", "again", "shows", "nothing",
  "my", "your", "this", "that", "then", "when", "what",
]);

function firstChunk(text: string, max = 60): string {
  const chunk = text.split(/[.,;\n]/)[0].trim();
  return chunk.length > max ? chunk.slice(0, max).trim() : chunk;
}

function cleanSteps(r: SolutionRecord): string[] {
  return r.steps.map((s) => s.trim()).filter(Boolean);
}

export function buildTitles(r: SolutionRecord): string[] {
  const symptom = firstChunk(r.symptoms);
  const titles = [
    `${r.device}: ${symptom.toLowerCase()} — the fix that worked`,
    `How to fix a ${r.device} that ${symptom.toLowerCase()}`,
  ];
  if (r.wrongPaths.trim() || r.story.trim()) {
    titles.push(`Don't replace your ${r.device} yet — try this first`);
  }
  return titles;
}

export function buildTags(r: SolutionRecord): string[] {
  const tags: string[] = [];
  const push = (t: string) => {
    const clean = t.trim().toLowerCase();
    if (clean && !tags.includes(clean)) tags.push(clean);
  };
  push(r.device);
  push(`${r.device} fix`);
  push(`how to fix ${r.device}`);
  push(firstChunk(r.symptoms));
  for (const word of `${r.device} ${r.symptoms}`.toLowerCase().split(/[^a-z0-9]+/)) {
    if (word.length > 2 && !STOPWORDS.has(word)) push(word);
  }
  return tags.slice(0, 15);
}

export function buildPackage(r: SolutionRecord): SolutionPackage | null {
  if (!proofGate(r).ready) return null;

  const steps = cleanSteps(r);
  const symptom = firstChunk(r.symptoms);
  const titles = buildTitles(r);

  // Shot list — original, faceless: the device, hands, and the fix happening.
  const shots: Shot[] = [
    { id: "shot-problem", label: `Film the ${r.device} doing exactly this: ${r.symptoms.trim()}`, covers: "The problem" },
  ];
  if (r.wrongPaths.trim()) {
    shots.push({ id: "shot-wrong", label: `Hold on the failing ${r.device} while you talk about what didn't work`, covers: "What didn't work" });
  }
  steps.forEach((step, i) => {
    shots.push({ id: `shot-step-${i + 1}`, label: `Hands + ${r.device}, close up: ${step}`, covers: `Step ${i + 1}` });
  });
  shots.push({ id: "shot-result", label: `Hold on the working ${r.device} — let the result speak`, covers: "The result" });

  // Voiceover script — the owner's words with minimal connective tissue.
  const script: ScriptSection[] = [];
  script.push({
    heading: "The problem",
    voiceover: `If your ${r.device} ${symptom.toLowerCase()}, here's what worked on mine. ${r.problem.trim()}`,
    shotIds: ["shot-problem"],
  });
  if (r.wrongPaths.trim()) {
    script.push({
      heading: "What didn't work",
      voiceover: r.wrongPaths.trim(),
      shotIds: ["shot-wrong"],
    });
  }
  script.push({
    heading: "The fix, step by step",
    voiceover: steps.map((s, i) => `Step ${i + 1}. ${s}`).join(" "),
    shotIds: steps.map((_, i) => `shot-step-${i + 1}`),
  });
  script.push({
    heading: "The result",
    voiceover: `${r.result.trim()} ${r.proofNote.trim()}`.trim(),
    shotIds: ["shot-result"],
  });
  if (r.limits.trim()) {
    script.push({
      heading: "When this won't help",
      voiceover: r.limits.trim(),
      shotIds: ["shot-result"],
    });
  }

  // Chapters ride the same section order. Timestamps get filled after the edit.
  const chapters = ["0:00 " + script.map((s) => s.heading).join("\n0:00 ")];

  const proofLine =
    r.proofLevel === "documented"
      ? "This is my own experience with my own device, and it matches the official documentation."
      : "This is my own experience with my own device.";

  const description = [
    `${r.problem.trim()}`,
    ``,
    `The fix that worked:`,
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `${r.result.trim()}`,
    r.limits.trim() ? `\nWhen this won't help: ${r.limits.trim()}` : ``,
    ``,
    `Chapters:`,
    chapters[0],
    ``,
    `${proofLine} Not sponsored.`,
  ].filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");

  const shortScript = [
    `${r.device} ${symptom.toLowerCase()}? Before you replace it:`,
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    `${firstChunk(r.result)}.`,
    `Full video has the details.`,
  ].join("\n");

  const pinnedComment = [
    `Did this fix yours? Say which model you have — it helps the next person.`,
    r.limits.trim() ? `Heads up: ${r.limits.trim()}` : ``,
  ].filter(Boolean).join(" ");

  const article = [
    `# ${titles[0]}`,
    ``,
    `${r.problem.trim()}`,
    ``,
    `**What it looked like:** ${r.symptoms.trim()}`,
    r.wrongPaths.trim() ? `\n**What didn't work:** ${r.wrongPaths.trim()}` : ``,
    ``,
    `## The fix`,
    ``,
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `**Result:** ${r.result.trim()}`,
    r.limits.trim() ? `\n**When this won't help:** ${r.limits.trim()}` : ``,
    ``,
    `*${proofLine} Not sponsored.*`,
  ].filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");

  return {
    titles,
    script,
    shotList: shots,
    shortScript,
    description,
    tags: buildTags(r),
    pinnedComment,
    thumbnail: {
      text: `${r.device.toUpperCase()}\n${symptom.toUpperCase()}?`,
      shot: `The clearest frame of the symptom — the ${r.device} mid-problem. Big text, no arrows, no shocked faces.`,
    },
    article,
  };
}

// ---------------------------------------------------------------------------
// Social versions — each points back to the primary video, no spam
// ---------------------------------------------------------------------------

export interface SocialPost {
  platform: string;
  text: string;
}

export const VIDEO_LINK_PLACEHOLDER = "[video link — paste it here after you publish]";

export function socialPack(r: SolutionRecord, pkg: SolutionPackage): SocialPost[] {
  const link = r.videoUrl.trim() || VIDEO_LINK_PLACEHOLDER;
  const symptom = firstChunk(r.symptoms);
  const hashtags = pkg.tags.slice(0, 4).map((t) => `#${t.replace(/[^a-z0-9]/g, "")}`).join(" ");
  const steps = cleanSteps(r);
  const oneLineFix = firstChunk(steps.join("; "), 100);

  return [
    { platform: "YouTube Short", text: pkg.shortScript },
    {
      platform: "Instagram Reel",
      text: `${r.device} ${symptom.toLowerCase()}? The fix took seconds — no replacement needed. Full video on the channel. ${hashtags}`,
    },
    {
      platform: "Facebook Reel",
      text: `Our ${r.device} ${symptom.toLowerCase()} and looked dead. It wasn't. ${firstChunk(r.result)}. Full walkthrough: ${link}`,
    },
    {
      platform: "TikTok",
      text: `${r.device} ${symptom.toLowerCase()}? Try this before you replace it. ${hashtags}`,
    },
    {
      platform: "X",
      text: `${r.device} ${symptom.toLowerCase()}? ${oneLineFix}. That's it. ${link}`,
    },
    {
      platform: "Pinterest",
      text: `How to fix a ${r.device} that ${symptom.toLowerCase()} — the exact steps that worked, with what to check first. ${link}`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Full package export — one markdown file the owner can keep or hand off
// ---------------------------------------------------------------------------

export function packageMarkdown(r: SolutionRecord, pkg: SolutionPackage): string {
  const social = socialPack(r, pkg);
  return [
    `# Production package — ${r.name}`,
    ``,
    `## Title options`,
    ...pkg.titles.map((t) => `- ${t}`),
    ``,
    `## Voiceover script`,
    ...pkg.script.flatMap((s) => [``, `### ${s.heading}`, s.voiceover]),
    ``,
    `## Shot list (original footage — film every one yourself)`,
    ...pkg.shotList.map((s) => `- [${s.covers}] ${s.label}`),
    ``,
    `## YouTube description`,
    "```",
    pkg.description,
    "```",
    ``,
    `## Tags`,
    pkg.tags.join(", "),
    ``,
    `## Pinned comment`,
    pkg.pinnedComment,
    ``,
    `## Thumbnail`,
    `Text: ${pkg.thumbnail.text.replace(/\n/g, " / ")}`,
    `Shot: ${pkg.thumbnail.shot}`,
    ``,
    `## Captions`,
    `Use the voiceover script above — it is the caption file.`,
    ``,
    `## Social versions`,
    ...social.flatMap((p) => [``, `### ${p.platform}`, p.text]),
    ``,
    `## Article (Step In The Ring)`,
    ``,
    pkg.article,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// The first seed solution — the Xumo discovery
// ---------------------------------------------------------------------------

export const XUMO_SEED: Partial<SolutionRecord> = {
  name: "Xumo box flashing white — it's not broken",
  problem:
    "The Spectrum Xumo box looked completely broken. It flashed white, power cycled over and over, or put nothing on the TV at all. Boxes had already been replaced over this.",
  device: "Spectrum Xumo Stream Box",
  symptoms: "Flashes white, keeps power cycling, or shows nothing on the TV",
  wrongPaths:
    "Support replaced multiple boxes that were never broken. Online help didn't surface the answer. The fix finally came from a Spectrum technician who said it was passed to him by another technician.",
  steps: [
    "Point the remote directly at the Xumo box",
    "Press and hold the green Home button for about five seconds",
    "Let go and give the box a moment to wake up",
  ],
  result: "The box wakes from standby and works normally. It was in standby the whole time — never broken.",
  limits:
    "This is for a box stuck in standby. If holding the Home button does nothing after a few tries, the box may have a real hardware problem.",
  proofLevel: "firsthand",
  proofNote: "Done on my own box, on camera-ready hardware, after replacements had already happened. The technician confirmed the same fix.",
};
