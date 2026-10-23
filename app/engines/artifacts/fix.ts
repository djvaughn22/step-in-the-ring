// Fix Engine → a repair brief: what kind of failure this is, the likely causes
// ranked, how to tell them apart in two minutes, the evidence to bring, and a
// repair prompt that targets THIS symptom.

import type { EngineArtifact } from "./types";
import { bullets, known, numbered, shortName, stripEnd, type Answers } from "./text";

interface Cause {
  cause: string;
  /** What you'd see if this is the one. */
  sign: string;
  fix: string;
}

interface Pattern {
  id: string;
  label: string;
  match: RegExp;
  causes: Cause[];
  /** Two-minute checks a non-developer can do, in order. */
  look: string[];
  regression: (thing: string) => string;
}

const PATTERNS: Pattern[] = [
  {
    id: "persist",
    label: "Saved data disappears after a refresh (a persistence bug)",
    match: /(refresh|reload|restart|come back|reopen|log ?out|next day|later).*(gone|disappear|vanish|lost|missing|empty|not there|reset|back to)|((gone|disappear|vanish|lost|missing|not sav|doesn'?t save|won'?t save|isn'?t saved).*(refresh|reload|reopen|restart|come back|later))|\bdoesn'?t (stay|persist|stick)|\bnot persist/,
    causes: [
      { cause: "Save only changes what's on screen. The new item is added to the page's in-memory list but never written to storage or sent to a server.", sign: "No network request when you press Save, and nothing new in Application → Local Storage.", fix: "Write the item to the real store inside the save handler (localStorage.setItem with the whole updated list, or the API call), and only show it as saved once that succeeds." },
      { cause: "The save is sent but fails quietly — a 4xx/5xx response, a validation error, or a missing permission — and the page shows the item anyway.", sign: "A request appears in the Network tab with a red/4xx/5xx status, or an error in the Console.", fix: "Fix the failing request (read the response body for the reason), and show an error instead of a fake success when a save fails." },
      { cause: "The save works, but loading on refresh overwrites it — the page starts from hard-coded sample data, reads a different storage key, or saves before it loads.", sign: "The item IS in storage/database right after saving, but gone from storage after the reload.", fix: "Load saved data first, and only fall back to sample data when nothing is saved. Use one storage key constant for both read and write." },
      { cause: "The server keeps it, but the page you reload is a cached copy (a statically built page or a stale fetch).", sign: "The item is in the database, but the reloaded page doesn't show it until a redeploy or a hard refresh.", fix: "Mark that page or fetch as dynamic / no-store, or revalidate after saving." },
    ],
    look: [
      "Open the page on a computer, right-click → Inspect, and open the Network tab. Add a test item and press Save. Note: did a request appear? What's its status number?",
      "Open the Console tab. Any red error text after pressing Save? Copy it exactly.",
      "If there was no request: open Application → Local Storage → your site. Is the new item in there right after saving? Reload — is it still in there?",
    ],
    regression: (thing) => `Add a ${thing}, reload the page, and confirm it's still there; then close and reopen the browser and confirm again. Also confirm a failed save shows an error instead of looking saved.`,
  },
  {
    id: "noop",
    label: "A button or form does nothing when pressed",
    match: /(button|link|tap|click|submit|form|save|send).*(does nothing|nothing happens|doesn'?t (do|work|respond)|not (working|responding)|unresponsive|won'?t (click|tap|work))/,
    causes: [
      { cause: "A JavaScript error stops the click handler before it runs.", sign: "Red error in the Console the moment you press it.", fix: "Fix the error at the line the Console points to." },
      { cause: "Something invisible sits on top of the button (an overlay, a menu, a fixed header) and catches the tap.", sign: "Right-click → Inspect on the button selects a different element.", fix: "Move or remove the covering element, or give it pointer-events: none." },
      { cause: "The button is disabled or the form fails validation silently.", sign: "The button has a disabled attribute, or a required field is empty with no message.", fix: "Show why it can't submit, next to the field." },
      { cause: "On phones only: the handler listens for mouse events, not taps.", sign: "Works with a mouse, fails on a phone.", fix: "Use click or pointer events, which fire for taps too." },
    ],
    look: [
      "Press it with the Console open (right-click → Inspect → Console). Copy any red error.",
      "Right-click the button → Inspect. Is the highlighted element actually the button?",
      "Does it fail on a computer too, or only on a phone?",
    ],
    regression: () => "Press the control with mouse, keyboard (Enter/Space) and on a phone; each does the expected thing exactly once.",
  },
  {
    id: "crash",
    label: "The page goes blank or shows an error",
    match: /blank|white screen|crash|error page|500|404|application error|something went wrong|won'?t load|doesn'?t load|not loading/,
    causes: [
      { cause: "A runtime error while rendering (often reading a field of something that's empty).", sign: "Red error in the Console naming a file and line.", fix: "Guard the empty case at that line and render a friendly empty state." },
      { cause: "A missing environment variable or secret in the live site that exists on your computer.", sign: "Works locally, broken only when deployed; server logs mention undefined/missing.", fix: "Add the variable in the hosting dashboard and redeploy." },
      { cause: "A route or file that was renamed/deleted.", sign: "404 status in the Network tab for the page or a script.", fix: "Restore the route or update the links." },
    ],
    look: ["Copy the exact error text from the page or Console.", "Does it happen locally, live, or both?", "Did it start after a specific change or deploy?"],
    regression: () => "Load the page with empty data, normal data, and while offline; it never blanks.",
  },
  {
    id: "layout",
    label: "Layout breaks on some screens",
    match: /(phone|mobile|small screen|iphone|android|tablet).*(cut off|overlap|too (big|small|wide)|scroll|broken|squish|off.?screen)|(cut off|overlap|sideways|horizontal scroll)/,
    causes: [
      { cause: "A fixed width (px) or a long unbroken word/URL wider than the phone.", sign: "The page scrolls sideways.", fix: "Use max-width: 100% and allow wrapping (overflow-wrap: anywhere)." },
      { cause: "Missing viewport meta tag.", sign: "Everything looks tiny and zoomed out on the phone.", fix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">." },
    ],
    look: ["Which phone and which page?", "A screenshot of the broken spot."],
    regression: () => "At 320px, 375px and 768px wide nothing scrolls sideways and nothing overlaps.",
  },
  {
    id: "deploy",
    label: "Works on your computer, broken when it's live",
    match: /(works|fine).*(local|my (computer|machine|laptop)).*(not|but|broken|fails)|(live|production|deployed|vercel|netlify).*(broken|fails|doesn'?t work|not working)/,
    causes: [
      { cause: "Environment variables set locally but not in the host.", sign: "Server logs show undefined keys.", fix: "Copy them into the host's settings and redeploy." },
      { cause: "Files ignored by git (never uploaded) or case-sensitive file names.", sign: "404s for files that exist on your computer.", fix: "Commit the missing file or fix the name's capitalisation." },
      { cause: "The live build is older than you think.", sign: "The deploy log's commit isn't your latest.", fix: "Trigger a fresh deploy from the latest commit." },
    ],
    look: ["Open the host's deploy log: did the latest deploy succeed, and which commit is it?", "Copy any error from the live site's Console."],
    regression: () => "The same steps pass locally AND on the live URL after a fresh deploy.",
  },
];

function patternFor(text: string): Pattern | null {
  const t = text.toLowerCase();
  return PATTERNS.find((p) => p.match.test(t)) ?? null;
}

/** The thing the symptom is about: "a new chore" → "chore". */
function thingIn(symptom: string): string {
  const m = symptom.toLowerCase().match(/\b(?:new|a|an|the|my)\s+([a-z]+)(?=\s+(?:i|we|it|and|but|that|disappears|is|shows|goes|after|when|button|,))/);
  const w = m?.[1] ?? "";
  return w && !/^(page|button|save|thing|time|way|app|site|refresh)$/.test(w) ? w : "item";
}

export function fixArtifact(a: Answers): EngineArtifact {
  const symptom = known(a, "symptom");
  const where = known(a, "exists");
  const errorText = known(a, "error");
  const when = known(a, "when");
  const protect = known(a, "protect");
  const should = known(a, "win");
  const pattern = patternFor(`${symptom} ${errorText}`);
  const thing = thingIn(symptom);
  const short: Record<string, string> = { persist: `${thing} disappears after refresh`, noop: "button does nothing", crash: "page goes blank", layout: "layout breaks on small screens", deploy: "broken only when live" };
  const title = known(a, "name") || `Fix: ${pattern ? short[pattern.id] : shortName(symptom, 60)}`;

  const assumptions: string[] = [];
  const unknowns: string[] = [];
  if (!where) unknowns.push("What it's built with and where the code lives. The causes below are the usual ones for this kind of bug in any web app; the repair prompt tells your assistant to look before changing anything.");
  if (!errorText) unknowns.push("Any error message. The first check below shows you where one would appear — paste it into the prompt if you find one.");
  if (!when) assumptions.push("It may never have worked (not a recent break), so the repair looks at the save path itself, not just recent changes.");
  if (!protect) assumptions.push("Everything else that works today must keep working; the prompt asks for a check of the main flow after the fix.");
  const expected = should || (pattern?.id === "persist" ? `The ${thing} is still there after a refresh, a browser restart, and the next day.` : "It does what it's supposed to, every time, on phone and computer.");

  const causes = pattern?.causes ?? [];
  const look = pattern?.look ?? [
    "Write the exact steps: what you tapped, in order, starting from opening the page.",
    "Right-click → Inspect → Console. Repeat the steps and copy any red error.",
    "Note where it fails: phone, computer, or both; live site, your computer, or both.",
  ];
  const repro = [
    "Open the page in a fresh browser window.",
    pattern?.id === "persist" ? `Add a ${thing} and press Save. Confirm it appears.` : `Do exactly this: ${stripEnd(symptom)}.`,
    pattern?.id === "persist" ? "Reload the page." : "",
    `Expected: ${stripEnd(expected)}.`,
    `Actual: ${stripEnd(symptom)}.`,
  ].filter(Boolean);
  const regression = pattern ? pattern.regression(thing) : `Repeat the reproduce steps after the fix and confirm the expected result; then run the main flow end to end.`;

  const prompt = [
    `Fix this bug. Look before you change anything.`,
    "",
    `SYMPTOM (the user's words): ${stripEnd(symptom)}.`,
    `EXPECTED: ${stripEnd(expected)}.`,
    pattern ? `KIND OF BUG: ${pattern.label}.` : "",
    where ? `WHERE IT LIVES: ${stripEnd(where)}.` : "",
    errorText ? `ERROR SEEN: ${stripEnd(errorText)}.` : "",
    when ? `LAST WORKED / WHAT CHANGED: ${stripEnd(when)}.` : "",
    "",
    "REPRODUCE:",
    numbered(repro),
    "",
    causes.length ? "CHECK THESE CAUSES IN ORDER — confirm which one it is from the code and the browser before editing:" : "FIND THE CAUSE: trace the code path for the steps above and confirm it in the browser before editing.",
    causes.length ? numbered(causes.map((c) => `${c.cause} Tell-tale sign: ${c.sign} Fix: ${c.fix}`)) : "",
    "",
    "RULES:",
    bullets([
      "Make the smallest change that fixes the confirmed cause. No refactors, no new libraries.",
      `Keep working: ${protect ? stripEnd(protect) : "everything that works today"}.`,
      `Add a test (or a written manual check if there's no test setup): ${regression}`,
    ]),
    "",
    "REPORT BACK: which cause it was and how you confirmed it, the exact change (files and lines), and the result of the reproduce steps after the fix.",
  ].filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");

  const sections = [
    { heading: "What's going on", body: pattern ? `${pattern.label}.\nExpected: ${stripEnd(expected)}.\nActual: ${stripEnd(symptom)}.` : `Expected: ${stripEnd(expected)}.\nActual: ${stripEnd(symptom)}.\nThis doesn't match a common bug pattern I recognise, so the brief below is about getting the evidence that pins it down.` },
    ...(causes.length ? [{ heading: "Likely causes, most likely first", body: numbered(causes.map((c) => `**${c.cause}**\n   You'd see: ${c.sign}\n   Fix: ${c.fix}`)) }] : []),
    { heading: "Two-minute check (tells the causes apart)", body: numbered(look) },
    { heading: "Reproduce", body: numbered(repro) },
    { heading: "Proves it's fixed", body: regression },
  ];

  return {
    engineId: "fix",
    kind: "Repair brief + repair prompt",
    title,
    summary: pattern
      ? `This is a common kind of bug: ${pattern.label.toLowerCase()}. Below are the ${causes.length} usual causes, a two-minute check that tells them apart, and a repair prompt for your coding assistant.`
      : `I don't recognise this exact pattern yet, so this brief gets the evidence first — the reproduce steps and checks below — then hands your coding assistant a careful, look-first repair prompt.`,
    nextAction: look[0],
    sections,
    assumptions,
    unknowns,
    prompt: { label: "Repair prompt — paste into your coding assistant", text: prompt },
    limitation: pattern ? undefined : "No cause is named because the symptom alone doesn't point to one. Run the two-minute check, add what you find as the error message, and regenerate for a targeted brief.",
  };
}

