// LAUNCH CHECKLIST — pure data + logic, no network.
//
// The checks to run before sharing a link with anyone. Every item is
// something a person can actually do and confirm themselves; none of it
// pretends to scan their site. "Software" items only show when the thing is
// a website or app, so a poem or a printable never gets told about secrets.

export interface CheckItem {
  id: string;
  label: string;
  why: string;
  softwareOnly?: boolean;
}

export interface CheckGroup {
  title: string;
  items: CheckItem[];
}

export const CHECK_GROUPS: CheckGroup[] = [
  {
    title: "It works",
    items: [
      { id: "phone", label: "I opened it on a phone and did the main thing start to finish.", why: "Most people will see it on a phone first." },
      { id: "computer", label: "I did the same on a computer.", why: "Layouts that work on one size often break on the other." },
      { id: "fresh", label: "Someone else opened it from the link I'm about to share.", why: "Your own browser remembers things a stranger's won't." },
    ],
  },
  {
    title: "It reads right",
    items: [
      { id: "links", label: "Every button and link goes somewhere real.", why: "A dead end is the fastest way to lose someone." },
      { id: "placeholder", label: "No placeholder text is left (lorem ipsum, “TODO”, sample names).", why: "It is easy to stop seeing it after the tenth look." },
      { id: "names", label: "Names, dates and spellings are right.", why: "Small mistakes make people doubt the rest." },
      { id: "title", label: "The title and first line say what this is, in plain words.", why: "That is what shows up when the link is shared. The one-line explainer tool can help." },
    ],
  },
  {
    title: "It's safe to share",
    items: [
      { id: "private", label: "Nothing private is in it: no home address, phone number, or anyone's details without permission.", why: "Once a link is shared, you can't take back who saw it." },
      { id: "kids", label: "No child's full name, school, or photo unless their parent said yes.", why: "Kids should build with a parent, and their details stay protected." },
      { id: "collect", label: "If it asks people for anything, it says what and why, and asks for no more than it needs.", why: "Collect less and there is less to protect." },
      { id: "secrets", label: "No passwords, API keys or tokens are in the published files or the code.", why: "Keys belong in your hosting provider's settings, never in the code.", softwareOnly: true },
    ],
  },
  {
    title: "You can fix it later",
    items: [
      { id: "copy", label: "I have a saved copy I can go back to.", why: "The first fix after launch sometimes breaks something else." },
      { id: "git", label: "The latest version is committed and pushed (for example to GitHub).", why: "A pushed commit is a copy that survives a dead laptop.", softwareOnly: true },
      { id: "contact", label: "People have a way to reach me or report a problem.", why: "The first problems are usually found by someone else." },
    ],
  },
];

export interface ChecklistState {
  software: boolean;
  done: string[];
}

export const EMPTY_CHECKLIST: ChecklistState = { software: true, done: [] };

export function visibleGroups(software: boolean): CheckGroup[] {
  return CHECK_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => software || !i.softwareOnly),
  }));
}

export function progress(state: ChecklistState): { done: number; total: number } {
  const ids = visibleGroups(state.software).flatMap((g) => g.items.map((i) => i.id));
  const done = ids.filter((id) => state.done.includes(id)).length;
  return { done, total: ids.length };
}

export function checklistText(state: ChecklistState): string {
  const p = progress(state);
  const lines = [`Launch checklist: ${p.done} of ${p.total} done`];
  for (const g of visibleGroups(state.software)) {
    lines.push("", g.title);
    for (const i of g.items) lines.push(`- [${state.done.includes(i.id) ? "x" : " "}] ${i.label}`);
  }
  return lines.join("\n");
}

const ALL_IDS = new Set(CHECK_GROUPS.flatMap((g) => g.items.map((i) => i.id)));

export function parseChecklistState(raw: unknown): ChecklistState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const done = Array.isArray(r.done) ? r.done.filter((id): id is string => typeof id === "string" && ALL_IDS.has(id)) : [];
  return { software: r.software !== false, done: [...new Set(done)] };
}
