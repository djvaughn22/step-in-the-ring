// Build Engine → an MVP scope and a paste-ready build prompt for THIS product:
// who does what, the screens, the data, the checks, and the exact prompt.

import type { EngineArtifact } from "./types";
import { readProduct, roleLabel, samplePerson, samplesFor, storyLine, type ProductRead, type Story } from "./product";
import { bullets, known, lowerFirst, numbered, plural, shortName, stripEnd, upperFirst, type Answers } from "./text";

type Devices = "shared" | "own" | "single" | "unknown";

function devicesFrom(a: Answers, p: ProductRead): Devices {
  const d = known(a, "devices").toLowerCase();
  if (/own|each|separate|phones|their own|different/.test(d)) return "own";
  if (/one|shared|same|single|tablet|family computer|kitchen/.test(d)) return "shared";
  if (!p.shared) return "single";
  return "unknown";
}

function stackFor(exists: string, devices: Devices): { stack: string; storage: string; setup: string[] } {
  const e = exists.toLowerCase();
  const sync = devices === "own";
  if (/next|react|vercel|vue|svelte|rails|django|flask|laravel|repo/.test(e)) {
    return {
      stack: `Keep the existing stack (${stripEnd(exists)}). Add to it; don't restart.`,
      storage: sync
        ? "A small hosted database the app already uses — or, if it has none, a Supabase project (no-cost starter tier) with one table. No user accounts: everyone shares one join code."
        : "Browser storage (localStorage) under one versioned key. No server, no accounts.",
      setup: sync ? ["Create the database project and put its URL and key in the environment settings (one time)."] : [],
    };
  }
  if (sync) {
    return {
      stack: "Next.js, hosted on Vercel (no-cost hobby tier).",
      storage: "One Supabase table (no-cost starter tier) so every phone sees the same data. No user accounts: everyone shares one join code.",
      setup: ["A Vercel account and a Supabase project, both on no-cost tiers (one time, about 15 minutes).", "Copy the Supabase URL and anon key into Vercel's environment settings."],
    };
  }
  return {
    stack: "One index.html file with plain HTML, CSS and JavaScript. It opens by double-clicking — no install, no build step.",
    storage: "Browser storage (localStorage) under one versioned key, read safely on load. Everything stays on the device it's used on.",
    setup: [],
  };
}

/** What a story means on screen, concretely. */
function detail(s: Story, p: ProductRead): string {
  const e = p.entity;
  const assigned = p.fields.some((f) => f.name === "assignedTo");
  const when = p.cadence === "weekly" ? " and the week" : p.cadence === "daily" ? " and the day" : "";
  if (s.verb === "assign") return `add a ${e} (a short title), choose who it's for${when}, and see everything assigned so far`;
  if (s.kind === "create") return `add a ${e} with a short title${when}; edit or delete one`;
  if (["check", "mark", "complete", "finish", "tick", "cross"].includes(s.verb)) return `see ${assigned ? `my ${plural(e)}` : `the ${plural(e)}`}${p.cadence === "weekly" ? " for this week" : ""} and tap one to mark it done (tap again to undo)`;
  if (s.verb === "claim" || s.verb === "pick") return `see what's still open and tap to claim one (it then shows their name)`;
  if (s.kind === "share") return `${lowerFirst(stripEnd(s.action))} with a link — no account needed to open it`;
  return lowerFirst(stripEnd(s.action));
}

function screens(p: ProductRead): string[] {
  const Entity = upperFirst(p.entity);
  const ents = plural(p.entity);
  const out: string[] = [];
  for (const role of p.roles) {
    const mine = p.stories.filter((s) => s.role === role);
    if (!mine.length) continue;
    out.push(`**${roleLabel(role)} view** — ${mine.map((s) => detail(s, p)).join("; ")}.`);
  }
  const everyone = p.stories.filter((s) => s.role === "everyone");
  if (everyone.length) {
    const when = p.cadence === "weekly" ? " this week" : p.cadence === "daily" ? " today" : "";
    out.push(`**Shared board** — every ${p.entity}${when}${p.fields.some((f) => f.name === "assignedTo") ? ", grouped by person" : ""}, with done ones clearly marked.`);
  }
  if (!out.length) out.push(`**${Entity} list** — add a ${p.entity}, see all ${ents}, open one to change it.`);
  if (p.roles.length > 1) out.push(`**Who's using it** — a simple switch at the top (${p.roles.map(roleLabel).join(" / ")}) and a picker for which person. No passwords in version one.`);
  return out;
}

function checks(p: ProductRead, devices: Devices): string[] {
  const [s1] = samplesFor(p.entity);
  const out: string[] = [];
  const assignee = p.roles.find((r) => r !== "parent" && r !== "teacher" && r !== "coach" && r !== "admin" && r !== "manager") ?? p.roles[0] ?? "user";
  const person = samplePerson(assignee);
  for (const s of p.stories) {
    if (s.kind === "create") {
      const to = s.verb === "assign" ? ` to ${person}` : "";
      out.push(`As a ${s.role === "everyone" ? "user" : s.role}, ${s.verb} "${s1}"${to}${p.cadence === "weekly" ? " for this week" : ""} → it appears ${to ? `on ${person}'s list and ` : ""}on the board right away.`);
    } else if (s.kind === "update") {
      out.push(`As ${s.role === "kid" || s.role === "child" || s.role === "student" || s.role === "player" ? person : `a ${s.role}`}, ${lowerFirst(stripEnd(s.action)).replace(new RegExp(`\\b${plural(p.entity)}\\b`), `"${s1}"`)} → it shows as done, with the time, for everyone.`);
    } else if (s.kind === "view") {
      out.push(`Open the ${s.role === "everyone" ? "shared board" : `${s.role} view`} → you can ${lowerFirst(stripEnd(s.action)).replace(/^see\s+/, "tell ")} at a glance, on a phone, without scrolling.`);
    } else if (s.kind === "share") {
      out.push(`${upperFirst(stripEnd(s.action))} → the other person can open it without making an account.`);
    }
  }
  out.push(devices === "own"
    ? `Add a ${p.entity} on one phone, open the app on a second phone → it's there within a few seconds.`
    : `Add a ${p.entity}, reload the page, close and reopen the browser → it's still there.`);
  out.push("At 375px wide (a small phone) nothing scrolls sideways and every button is easy to tap.");
  out.push(`The first visit, with no ${plural(p.entity)} yet, says what to do first instead of showing an empty screen.`);
  return out;
}

export function buildArtifact(a: Answers): EngineArtifact {
  const purpose = known(a, "purpose", "rough", "core");
  const core = known(a, "core");
  const p = readProduct(purpose, core);
  const who = known(a, "who");
  const exists = known(a, "exists");
  const limit = known(a, "constraint");
  const problem = known(a, "problem");
  const devices = devicesFrom(a, p);
  const { stack, storage, setup } = stackFor(exists, devices);
  const title = known(a, "name") || shortName(p.product || purpose || "Version one");
  const ents = plural(p.entity);

  const assumptions: string[] = [];
  const unknowns: string[] = [];
  if (devices === "unknown") assumptions.push(`Everyone uses ONE shared device (a family tablet or laptop), so ${ents} save in that browser — no server, no accounts. If people will use their own phones, answer the device question and regenerate: the scope adds a small hosted database.`);
  if (devices === "single") assumptions.push(`One person uses it on one device, so ${ents} save in that browser.`);
  if (p.roles.length > 1) assumptions.push(`No passwords in version one: anyone holding the device can switch between ${p.roles.map((r) => plural(r)).join(" and ")}. Fine for a household; not for strangers.`);
  if (p.cadence === "weekly") assumptions.push(`A week runs Monday to Sunday. ${upperFirst(ents)} belong to one week; repeating them automatically waits for version two.`);
  if (!exists) assumptions.push("Nothing exists yet, so this starts from an empty folder.");
  if (!p.stories.length) unknowns.push(`What people actually DO with it. I couldn't find an action in "${stripEnd(purpose)}". Say it as "who does what" (e.g. "parents add chores, kids tick them off") and regenerate — the screens and checks below are a bare starting skeleton until then.`);
  if (!who && !p.roles.length) unknowns.push("Who uses it. Assumed: one person, you.");

  const outOfScope = [
    devices === "own" ? "User accounts and passwords (a shared join code is enough)" : "Accounts, logins, and syncing between devices",
    "Notifications, reminders, and email",
    "Points, rewards, streaks, or allowances",
    "Payments",
    "Repeating schedules and automation",
    "A native phone app (the web page works on phones)",
    ...(limit ? [`Anything that breaks your limit: ${stripEnd(limit)}`] : []),
  ];

  const scope = [
    ...p.stories.map(storyLine),
    ...(p.stories.length ? [] : [`Add a ${p.entity}, see the list, mark one changed.`]),
    `Everything saved survives a reload.`,
  ];
  const data = [
    `**${upperFirst(p.entity)}** — ${p.fields.map((f) => `\`${f.name}\` (${f.note})`).join(", ")}`,
    ...(p.roles.length > 1 || p.fields.some((f) => f.name === "assignedTo")
      ? [`**Person** — \`id\`, \`name\`, \`role\` (${p.roles.join(" / ") || "member"})`]
      : []),
  ];
  const sampleRows = samplesFor(p.entity);
  const people = p.roles.length > 1 ? p.roles.flatMap((r) => (r === "parent" || r === "teacher" || r === "coach" ? [samplePerson(r)] : [samplePerson(r, 0), samplePerson(r, 1)])) : [];
  const checksList = checks(p, devices);

  const prompt = [
    `Build version one of "${title}": ${stripEnd(purpose)}.`,
    problem ? `Why it matters: ${stripEnd(problem)}.` : "",
    "",
    "WHAT IT MUST DO (nothing more):",
    bullets(scope),
    "",
    "SCREENS:",
    bullets(screens(p).map((s) => s.replace(/\*\*/g, ""))),
    "",
    "DATA:",
    bullets(data.map((d) => d.replace(/\*\*|`/g, ""))),
    `Seed it with sample data so it isn't empty on first run: ${sampleRows.join(", ")}${people.length ? `; people: ${people.join(", ")}` : ""}. Make the sample data easy to clear.`,
    "",
    `STACK: ${stack}`,
    `STORAGE: ${storage}`,
    "",
    "NOT IN VERSION ONE:",
    bullets(outOfScope),
    "",
    "DONE WHEN every one of these passes (check each in a real browser):",
    numbered(checksList),
    "",
    "ASSUMPTIONS I MADE (flag any that seem wrong before building):",
    bullets(assumptions),
    "",
    exists ? `Something already exists (${stripEnd(exists)}). Look at it first, keep what works, and change only what this needs.` : "Start from an empty folder.",
    "When you finish, tell me: what you built, how to open it, which checks you ran and their results, and anything you skipped.",
  ].filter((l) => l !== "").join("\n").replace(/\n(?=(?:WHAT IT|SCREENS|DATA|STACK|NOT IN|DONE WHEN|ASSUMPTIONS|Something already|Start from)\b)/g, "\n\n");

  const firstCheck = checksList[0] ?? "the first check";
  return {
    engineId: "build",
    kind: "MVP scope + build prompt",
    title,
    summary: `Version one of ${p.product}: ${p.stories.length ? `${p.stories.length} things people can do, ` : ""}${screens(p).length} screen${screens(p).length === 1 ? "" : "s"}, one ${p.entity} record, and ${checksList.length} checks that say when it's done. Paste the prompt into your coding assistant (Claude Code, Cursor, ChatGPT) as-is.`,
    nextAction: `Copy the build prompt below into your coding assistant. When it says it's done, run check 1 yourself: ${firstCheck.replace(/\.$/, "")}.`,
    sections: [
      { heading: "What version one does", body: bullets(scope) },
      { heading: "Screens", body: bullets(screens(p)) },
      { heading: "Data it keeps", body: bullets(data) },
      { heading: "How it's built", body: [`Stack: ${stack}`, `Storage: ${storage}`, setup.length ? `One-time setup you'll do yourself:\n${bullets(setup)}` : "Setup: none — no accounts or keys needed."].join("\n") },
      { heading: "Not in version one", body: bullets(outOfScope) },
      { heading: "Done when", body: numbered(checksList) },
    ],
    assumptions,
    unknowns,
    prompt: { label: "Build prompt — paste into your coding assistant", text: prompt },
    limitation: p.stories.length ? undefined : "I couldn't read what people do with it, so the scope is a skeleton. Add one \"who does what\" sentence and regenerate.",
  };
}

