// Plan Engine → a dated plan: phases with real dates, owners, what depends on
// what, checkpoints that warn early, risks, and this week's actions.

import type { EngineArtifact } from "./types";
import {
  addDays, bullets, fmtDate, has, known, money, nextWeekday, numbered, parseDeadline, parseHeadcount,
  parseMoney, shortName, stripEnd, type Answers,
} from "./text";

// Typical per-family pledge, event ticket and one-off gift used for the
// goal math. Labeled as assumptions in the output.
const PLEDGE = 50;
const TICKET = 20;
const GIFT = 30;
const DEFAULT_GOAL = 3000;

type Kind = "fundraiser" | "event" | "launch" | "move" | "generic";

interface Task { text: string; owner: string }
interface Phase { name: string; start: number; end: number; tasks: Task[]; doneWhen: string }

function kindOf(text: string): Kind {
  if (has(text, /fundrais|raise \$|raise money|donation|pledge|\$[\d,]+k?\b.*(raise|goal)|bake sale|auction|charity/)) return "fundraiser";
  if (has(text, /\b(party|wedding|reunion|event|festival|dinner|gala|tournament|meetup|conference|show|concert|banquet|picnic|camp|retreat|celebration|night)\b/)) return "event";
  if (has(text, /\blaunch|release|campaign|open(ing)? (the|a|my)|grand opening|go live/)) return "launch";
  if (has(text, /\bmov(e|ing) (to|house|out|in)|relocat/)) return "move";
  return "generic";
}

function owners(peopleText: string): { lead: string; a: string; b: string; count: number; assumed: boolean } {
  const n = parseHeadcount(peopleText);
  const helperWord = has(peopleText, /parent/) ? "Parent volunteer" : has(peopleText, /volunteer/) ? "Volunteer" : has(peopleText, /friend/) ? "Friend" : "Helper";
  if (n === 1) return { lead: "You", a: "You", b: "You", count: 1, assumed: false };
  return { lead: "You", a: `${helperWord} 1`, b: `${helperWord} 2`, count: n ?? 3, assumed: n === null };
}

function fundraiserFormat(goal: number, people: number, situation: string): { pick: string; why: string; math: string; options: string[]; decided: boolean } {
  const s = situation.toLowerCase();
  const decided = /(bake sale|auction|fun run|read-?a-?thon|walk-?a-?thon|dinner|raffle|car wash|movie night|online|gofundme|donation page|t-?shirt|candle|cookie dough)/.exec(s)?.[1];
  const families = Math.ceil(goal / PLEDGE);
  const tickets = Math.ceil((goal + Math.round(goal * 0.15)) / TICKET);
  const donors = Math.ceil(goal / GIFT);
  const options = [
    `Pledge drive + one fun day (read-a-thon or fun run): ${families} families × ${money(PLEDGE)} in pledges = ${money(families * PLEDGE)}. Lowest cost, lightest volunteer load.`,
    `One-night event (spaghetti dinner or movie night): ${tickets} tickets × ${money(TICKET)}, after about ${money(goal * 0.15)} in costs. Needs a venue and more hands on the night.`,
    `Online donation page + a bake sale table: ${donors} donors × ${money(GIFT)}. Simplest to run; depends on reach.`,
  ];
  if (decided) {
    return { pick: decided, why: "you named it", math: "", options: [], decided: true };
  }
  const pickEvent = people >= 6;
  return {
    pick: pickEvent ? "a one-night event" : "a pledge drive with one fun day, like a read-a-thon or fun run",
    why: pickEvent ? `with ${people} people you can staff an evening, and ticket sales are predictable` : `a small team can run it, it costs almost nothing up front, and ${families} families pledging about ${money(PLEDGE)} each reaches ${money(goal)}`,
    math: pickEvent ? `${tickets} tickets × ${money(TICKET)} ≈ ${money(tickets * TICKET)}, minus about ${money(goal * 0.15)} in costs.` : `${families} families × ${money(PLEDGE)} = ${money(families * PLEDGE)}. If the school has more families than that, the average pledge can be lower.`,
    options,
    decided: false,
  };
}

function phasesFor(kind: Kind, total: number, o: ReturnType<typeof owners>, goal: number | null, format: string, eventDay: number): Phase[] {
  const at = (f: number) => Math.max(1, Math.round(total * f));
  if (kind === "fundraiser") {
    const g = goal ? money(goal) : "the goal";
    return [
      { name: "Approve and decide", start: 0, end: at(0.17), doneWhen: "the school has approved the format and the date in writing, and two helpers have said yes", tasks: [
        { text: `Email the principal or PTA lead: the goal (${g}), the format (${format}), and the proposed fun day. Ask what approval and rules apply (handling money, flyers, using school space).`, owner: o.lead },
        { text: "Ask two people to take a job each: one for money/pledges, one for promotion.", owner: o.lead },
        { text: "Pick the fun-day date and a backup date.", owner: o.lead },
      ] },
      { name: "Set up", start: at(0.17), end: at(0.33), doneWhen: "a family can pledge or donate in under two minutes, and the flyer is approved", tasks: [
        { text: "Set up the way money comes in: a school-approved online donation page or pledge form, plus a cash/check envelope process with two people counting.", owner: o.a },
        { text: `Write a one-page flyer and a short email: what it's for, ${g} goal, how to pledge, the date.`, owner: o.b },
        { text: "Make a simple tracker (a spreadsheet): family, pledged, collected.", owner: o.a },
      ] },
      { name: "Promote and collect pledges", start: at(0.33), end: eventDay, doneWhen: `pledges total at least ${goal ? money(goal) : "the goal"}`, tasks: [
        { text: "Send the announcement through the school newsletter/app and to class parent groups.", owner: o.b },
        { text: "Post the running total every week — a visible goal gets people moving.", owner: o.b },
        { text: "Send a reminder to families who haven't pledged, once mid-way and once three days before the fun day.", owner: o.a },
      ] },
      { name: "Fun day", start: eventDay, end: eventDay, doneWhen: "the event happened and every participant is recorded", tasks: [
        { text: "Run it: sign-in sheet, a few helpers, photos for the thank-you.", owner: o.lead },
      ] },
      { name: "Collect and close out", start: eventDay + 1, end: total, doneWhen: `the money is deposited, the total is reported, and thank-yous are sent`, tasks: [
        { text: "Collect the outstanding pledges (one reminder with the link).", owner: o.a },
        { text: "Deposit and report the final total to the school.", owner: o.a },
        { text: "Send thank-yous with the total and what it pays for.", owner: o.b },
      ] },
    ];
  }
  if (kind === "event") {
    return [
      { name: "Lock the basics", start: 0, end: at(0.2), doneWhen: "date, place and budget are confirmed", tasks: [
        { text: "Confirm the date and book the place (get it in writing).", owner: o.lead },
        { text: "Set the budget and the headcount you're planning for.", owner: o.lead },
        { text: "Ask helpers to take one area each: food, setup, invitations.", owner: o.lead },
      ] },
      { name: "Invite and arrange", start: at(0.2), end: at(0.6), doneWhen: "invitations are out and every vendor/supply is booked", tasks: [
        { text: "Send invitations with an RSVP date.", owner: o.b },
        { text: "Book food, equipment, and anything rented.", owner: o.a },
      ] },
      { name: "Confirm", start: at(0.6), end: Math.max(at(0.6), total - 2), doneWhen: "final headcount is in and the run-of-show is written", tasks: [
        { text: "Chase RSVPs; give the final number to food/venue.", owner: o.b },
        { text: "Write a one-page run-of-show: who does what, when, on the day.", owner: o.lead },
      ] },
      { name: "The day and after", start: total, end: total, doneWhen: "it happened, it's cleaned up, and bills are paid", tasks: [
        { text: "Run the day from the run-of-show.", owner: o.lead },
        { text: "Pay outstanding bills and send thank-yous.", owner: o.a },
      ] },
    ];
  }
  // launch / move / generic share a define → do → finish shape.
  return [
    { name: "Define and line up", start: 0, end: at(0.2), doneWhen: "the finish line and the jobs are written down and agreed", tasks: [
      { text: "Write the finish line in one sentence and share it with everyone involved.", owner: o.lead },
      { text: "List every job that has to happen; give each one an owner.", owner: o.lead },
      { text: "Identify anything that needs someone else's yes (approvals, bookings, money) and ask now.", owner: o.lead },
    ] },
    { name: "Do the main work", start: at(0.2), end: at(0.8), doneWhen: "every job on the list is done or deliberately dropped", tasks: [
      { text: "Work the list in order of what blocks other things.", owner: o.a },
      { text: "Check progress once a week against the checkpoint below.", owner: o.lead },
    ] },
    { name: "Finish and wrap up", start: at(0.8), end: total, doneWhen: "the outcome is reached and loose ends are closed", tasks: [
      { text: "Close the last items and confirm the outcome happened.", owner: o.lead },
      { text: "Tell everyone involved how it went.", owner: o.b },
    ] },
  ];
}

export function planArtifact(a: Answers, now: Date = new Date()): EngineArtifact {
  const outcome = known(a, "outcome");
  const people = known(a, "people");
  const situation = [known(a, "situation"), known(a, "problem")].filter(Boolean).join(" ");
  const limit = known(a, "constraint");
  const all = `${outcome} ${situation} ${known(a, "deadline")}`;
  const kind = kindOf(all);
  const deadline = parseDeadline(known(a, "deadline") || outcome, now);
  const assumptions: string[] = [];
  const unknowns: string[] = [];
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const total = deadline ? Math.max(7, deadline.days) : 42;
  const end = addDays(today, total);
  if (!deadline) assumptions.push(`No deadline given, so this plan runs six weeks, to ${fmtDate(end)}. Give a date and regenerate to re-time it.`);
  // "Me and 3 volunteers" typed into the outcome counts too, when the people
  // question was left blank.
  const peopleText = people || (parseHeadcount(`${outcome} ${situation}`) !== null ? `${outcome} ${situation}` : "");
  const o = owners(peopleText);
  if (peopleText && o.assumed && o.count > 1) assumptions.push(`Owners are you plus two helpers ("${o.a}", "${o.b}"). Swap in real names when you share it.`);
  if (!peopleText) assumptions.push(`It's you plus two helpers ("${o.a}", "${o.b}"). If it's just you, every owner is you — the order still holds.`);
  const goal = parseMoney(all);

  let format = "";
  const fr = kind === "fundraiser" ? fundraiserFormat(goal ?? DEFAULT_GOAL, o.count, situation + " " + outcome) : null;
  if (fr) {
    format = fr.pick;
    if (!fr.decided) assumptions.push(`Format: ${fr.pick} — chosen because ${fr.why}. The other options are listed below; pick one and regenerate if you prefer it.`);
    if (!goal) unknowns.push(`The money goal. The math assumes ${money(DEFAULT_GOAL)}.`);
  }
  // Put the event day on a Saturday about 80% of the way in.
  const eventDay = kind === "fundraiser"
    ? Math.round((nextWeekday(addDays(today, Math.round(total * 0.75)), 6).getTime() - today.getTime()) / 86_400_000)
    : total;
  const phases = phasesFor(kind, total, o, goal, format, Math.min(eventDay, total - 3));
  const when = (d: number) => fmtDate(addDays(today, d));

  const checkpoints: string[] = [];
  if (kind === "fundraiser" && goal) {
    checkpoints.push(
      `${when(Math.round(total * 0.5))}: at least ${money(goal * 0.35)} pledged. Below that, send a second push and ask each helper to personally ask five families.`,
      `${when(Math.round(total * 0.7))}: at least ${money(goal * 0.75)} pledged. Below that, add a matching challenge or a bake-sale table on the fun day.`,
      `${fmtDate(end)}: ${money(goal)} collected.`,
    );
  } else {
    checkpoints.push(
      `${when(phases[0].end)}: ${phases[0].name.toLowerCase()} is done (${phases[0].doneWhen}). If not, the whole plan slips — fix this first.`,
      `${when(Math.round(total * 0.6))}: more than half the jobs are done.`,
      `${fmtDate(end)}: finish line reached${outcome ? ` — ${shortName(outcome, 60)}` : ""}.`,
    );
  }

  const risks = kind === "fundraiser"
    ? [
      "School approval takes longer than a week → ask on day one, and ask what you can start before it's final.",
      "Pledges come in slowly → the weekly total and the two reminders are the fix; don't wait for the end.",
      "Pledged money never gets collected → collect online up front where possible; one reminder right after the fun day.",
      "Rain on the fun day → the backup date from phase 1.",
      "Handling cash → two people count, and it's deposited the same week.",
    ]
    : [
      "The first phase drags → it's the only one with hard deadlines on other people; start those asks today.",
      "One person holds too many jobs → spread them before phase 2.",
      ...(limit ? [`Your limit (${stripEnd(limit)}) → check every phase against it before committing money or time.`] : []),
    ];

  const dependencies = kind === "fundraiser"
    ? ["Approval → before any flyer or announcement goes out.", "The way to pledge/donate → before promotion starts.", "Promotion → needs at least two weeks before the fun day.", "Collection → right after the fun day, before thank-yous."]
    : phases.slice(1).map((p, i) => `${p.name} → starts after ${phases[i].name.toLowerCase()} is done.`);

  const thisWeek = phases[0].tasks.slice(0, 3).map((t, i) => `${when(Math.min(i + 1, phases[0].end))} — ${t.owner}: ${t.text}`);

  const phaseText = phases.map((p, i) => [
    `**${i + 1}. ${p.name}** — ${p.start === p.end ? when(p.start) : `${when(p.start)} → ${when(p.end)}`}`,
    ...p.tasks.map((t) => `   - ${t.owner}: ${t.text}`),
    `   - Done when: ${p.doneWhen}.`,
  ].join("\n")).join("\n\n");

  const title = known(a, "name") || shortName(outcome || "Plan");
  const sections = [
    { heading: "Timeline", body: phaseText },
    ...(fr && !fr.decided ? [{ heading: "Ways to reach the goal", body: `${numbered(fr.options)}\n\nThis plan uses: ${fr.pick}. ${fr.math}` }] : []),
    { heading: "What has to happen first", body: bullets(dependencies) },
    { heading: "Checkpoints (early warning)", body: bullets(checkpoints) },
    { heading: "Risks and what to do about them", body: bullets(risks) },
  ];
  if (limit) sections.push({ heading: "Your limit", body: stripEnd(limit) + "." });

  const plain = [
    `${title} — plan, ${fmtDate(today)} to ${fmtDate(end)}`,
    "",
    ...phases.map((p, i) => `${i + 1}. ${p.name} (${p.start === p.end ? when(p.start) : `${when(p.start)} – ${when(p.end)}`})\n${p.tasks.map((t) => `   - [ ] ${t.owner}: ${t.text}`).join("\n")}`),
    "",
    "Checkpoints:",
    bullets(checkpoints),
  ].join("\n");

  return {
    engineId: "plan",
    kind: kind === "fundraiser" ? "Fundraiser plan" : kind === "event" ? "Event plan" : "Project plan",
    title,
    summary: `${phases.length} phases from ${fmtDate(today)} to ${fmtDate(end)}, each with dates, owners and a "done when". ${kind === "fundraiser" && goal ? `Built to reach ${money(goal)}. ` : ""}The first three actions below are for this week.`,
    nextAction: thisWeek[0] ?? phases[0].tasks[0].text,
    sections: [{ heading: "This week", body: numbered(thisWeek) }, ...sections],
    assumptions,
    unknowns,
    prompt: { label: "Shareable checklist — paste into a doc, email or group chat", text: plain },
    limitation: outcome ? undefined : "No outcome was given, so this is a generic three-phase shape. Say what you're trying to get done and regenerate.",
  };
}
