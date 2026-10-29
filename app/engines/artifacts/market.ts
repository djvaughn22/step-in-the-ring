// Sell, Launch and Grow → an offer sheet, a launch kit, and a growth
// experiment. Each one is filled in from the visitor's answers, with any
// number the engine chose labeled as an assumption to test.

import type { EngineArtifact } from "./types";
import {
  addDays, bullets, fmtDate, has, known, lowerFirst, money, numbered, parseMoney, shortName, stripEnd, upperFirst,
  type Answers,
} from "./text";

// ---- SELL -------------------------------------------------------------------

type Format = "digital" | "physical" | "service" | "software";

function formatOf(text: string): Format {
  if (has(text, /printable|template|pdf|download|ebook|e-book|course|preset|pattern|worksheet|planner insert|digital|svg|font|guide/)) return "digital";
  if (has(text, /lesson|tutor|coach|clean|walk|sit|babysit|mow|repair|consult|session|service|photograph|design for|class|cater|haircut|training|install/)) return "service";
  if (has(text, /\bapp\b|software|saas|subscription|website|plugin|extension/)) return "software";
  return "physical";
}

function priceFor(format: Format, text: string, stated: number | null): { test: number; low: number; high: number; why: string } {
  if (stated) return { test: stated, low: Math.round(stated * 0.7), high: Math.round(stated * 1.4), why: "your price" };
  if (format === "digital") return { test: 9, low: 5, high: 15, why: `small digital downloads usually sell between ${money(5)} and ${money(15)}` };
  if (format === "service") return { test: 40, low: 25, high: 60, why: `a local, one-hour service usually lands between ${money(25)} and ${money(60)}` };
  if (format === "software") return { test: 5, low: 0, high: 10, why: "a small tool is easiest to test at a low monthly price, or at no charge with a paid upgrade" };
  const known: [RegExp, number][] = [[/mug/, 18], [/shirt|tee|hoodie/, 25], [/candle/, 16], [/cookie|brownie|bak/, 12], [/sticker/, 4], [/print|poster/, 20], [/jewel|necklace|bracelet|earring/, 22], [/card/, 6]];
  const hit = known.find(([re]) => has(text, re));
  const test = hit ? hit[1] : 20;
  return { test, low: Math.round(test * 0.75), high: Math.round(test * 1.5), why: hit ? "similar items commonly sell around this price" : "a mid-range starting point for a handmade or small-batch item" };
}

export function sellArtifact(a: Answers): EngineArtifact {
  const product = known(a, "product", "purpose", "rough");
  const customer = known(a, "customer", "who");
  const problem = known(a, "problem");
  const channel = known(a, "channel");
  const exists = known(a, "exists");
  const all = `${product} ${problem} ${channel}`;
  const format = formatOf(all);
  const price = priceFor(format, all, parseMoney(known(a, "price") || product));
  const name = known(a, "name") || shortName(product || "Your offer");
  const buyer = customer || (format === "service" ? "busy neighbors" : "people who already buy things like this");
  const assumptions: string[] = [];
  const unknowns: string[] = [];
  if (!parseMoney(known(a, "price") || product)) assumptions.push(`Price to test: ${money(price.test)} — ${price.why}. The test below tells you if it's right.`);
  if (!customer) assumptions.push(`Buyer: ${buyer}. Name a more specific buyer and regenerate — it sharpens the headline and the test.`);
  const where = channel || (format === "digital" ? "Etsy or Gumroad (both handle payment and the download)" : format === "service" ? "a one-page sign-up form, shared in local groups and by word of mouth; payment at the first session" : format === "software" ? "a one-page site with a sign-up button" : "Etsy, or a local market table plus a payment app");
  if (!channel) assumptions.push(`Where it sells: ${where}.`);
  if (!problem) unknowns.push("The problem it solves for them. The copy below leads with what they get instead; adding the problem makes it stronger.");

  const headline = `${upperFirst(stripEnd(name))} — for ${lowerFirst(buyer)}`;
  const gets = [
    upperFirst(stripEnd(product || name)) + ".",
    format === "digital" ? "Instant download after purchase — print or use it as many times as you need at home." : format === "service" ? "Booked at a time that works for you; nothing to set up." : format === "software" ? "Works in your browser; nothing to install." : "Made to order and ready in about a week.",
    problem ? `Solves: ${lowerFirst(stripEnd(problem))}.` : "",
  ].filter(Boolean);
  const copy = [
    headline,
    "",
    problem ? `${upperFirst(stripEnd(problem))}? This fixes that.` : `Made for ${lowerFirst(stripEnd(buyer))}.`,
    "",
    bullets(gets),
    "",
    `${money(price.test)}${format === "software" ? "/month" : format === "service" ? " per session" : ""}.`,
    format === "service" ? "→ Book your first session" : "→ Get it now",
  ].join("\n");
  const message = `Hi! I'm starting to sell ${lowerFirst(stripEnd(product || name))}${customer && !/\bfor\b/i.test(product) ? ` for ${lowerFirst(stripEnd(customer))}` : ""}.${product.includes(money(price.test)) || product.includes(`$${price.test}`) ? "" : ` It would be ${money(price.test)}.`} Would you buy one at that price — yes, no, or "only if…"? Honest answers help more than nice ones.`;

  return {
    engineId: "sell",
    kind: "Offer sheet + first sales test",
    title: name,
    summary: `A ready offer: who it's for, what they get, a price to test (${money(price.test)}), sales copy you can paste, and a one-week test that tells you whether anyone will pay.`,
    nextAction: `Send the message below to 10 people who match "${buyer}" — five today.`,
    sections: [
      { heading: "The offer", body: [`Who it's for: ${buyer}`, `What they get:\n${bullets(gets)}`, `Price to test: ${money(price.test)} (range worth trying: ${money(price.low)}–${money(price.high)})`, `Where they buy: ${where}`, exists ? `Already have: ${stripEnd(exists)}` : ""].filter(Boolean).join("\n") },
      { heading: "Sales copy (paste onto the listing or page)", body: copy },
      { heading: "One-week test", body: numbered([
        `Day 1–2: send the message (below) to 10 people who match the buyer. Not family who'll say yes to be nice.`,
        `Day 3–5: anyone who says yes gets the real link or a "reserve one" reply. Count actual payments, not compliments.`,
        `Day 7: decide. 3+ yeses and 1+ payment → list it publicly at ${money(price.test)}. Yeses but no payments → try ${money(price.low)}, or a clearer photo/description. Mostly no → ask the no's what they'd want instead before changing anything.`,
      ]) },
      { heading: "Message to send", body: message },
    ],
    assumptions,
    unknowns,
    prompt: { label: "Listing / page copy", text: copy },
    limitation: product ? undefined : "No product was described, so the offer is a placeholder. Say what you're selling and regenerate.",
  };
}

// ---- LAUNCH -----------------------------------------------------------------

export function launchArtifact(a: Answers, now: Date = new Date()): EngineArtifact {
  const what = known(a, "what", "product", "purpose");
  const audience = known(a, "audience", "who");
  const exists = known(a, "exists");
  const worried = known(a, "worried");
  const measure = known(a, "measure");
  const url = (`${exists} ${what}`.match(/https?:\/\/\S+|\b[\w-]+\.(?:com|org|net|io|app|dev|co)\b\S*/) ?? [""])[0].replace(/[.,)]+$/, "");
  const link = url || "[your link]";
  const name = known(a, "name") || shortName(what || "Launch");
  const crowd = audience || "the first 20 people who'd care";
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const d = (n: number) => fmtDate(addDays(today, n));
  const target = measure || "10 people try it in the first week, and at least 2 come back or reply";
  const assumptions: string[] = [];
  const unknowns: string[] = [];
  if (!url) unknowns.push("The link. Messages below use [your link] — swap it in before sending.");
  if (!measure) assumptions.push(`First result to count: ${target}.`);
  if (!audience) assumptions.push("First audience: about 20 people you can message personally. A small, real audience beats a big quiet one.");

  const checklist = [
    worried ? `Your worry first — "${stripEnd(worried)}": try it yourself on a phone and on a computer. If it stops someone using it, fix it now; if it's only rough, launch and note it.` : "",
    `Open ${url || "the link"} on a phone with Wi-Fi off (mobile data). It loads and the main thing works.`,
    "A stranger can tell what it is in five seconds from the first screen. Ask someone who hasn't seen it.",
    "There's one obvious thing to do first (one main button).",
    "There's a way to reach you: an email or a reply address on the page.",
    `You can count the result: ${lowerFirst(stripEnd(target))}. If you can't see it yet, add simple page-view counting or a simple sign-up form before the launch.`,
  ].filter(Boolean);
  const personal = `Hey — I just finished ${lowerFirst(stripEnd(what || name))}${audience && !/\bfor\b/i.test(what) ? ` for ${lowerFirst(stripEnd(audience))}` : ""}. Would you try it and tell me the first thing that confused you? ${link}`;
  const post = `I made ${lowerFirst(stripEnd(what || name))}${audience && !/\bfor\b/i.test(what) ? ` for ${lowerFirst(stripEnd(audience))}` : ""}. It's live today: ${link}\nIf you try it, I'd love to hear what you'd change.`;
  const email = `Subject: ${upperFirst(stripEnd(name))} is live\n\nHi,\n\nI've been working on ${lowerFirst(stripEnd(what || name))}, and it's ready for its first real users. Here it is: ${link}\n\nIt takes about two minutes to try. Reply with anything that didn't make sense — that's the most useful thing you can send me.\n\nThanks!`;

  return {
    engineId: "launch",
    kind: "Launch kit",
    title: name,
    summary: `A one-week launch: a pre-flight checklist, three ready-to-send messages, dates for each step, and the one result to count (${lowerFirst(stripEnd(target))}).`,
    nextAction: checklist[0],
    sections: [
      { heading: "Before you announce (pre-flight)", body: numbered(checklist) },
      { heading: "Launch week", body: bullets([
        `${d(0)}–${d(1)}: pre-flight checklist; send the personal message to 5 friendly testers.`,
        `${d(2)}: fix only what stopped a tester from using it.`,
        `${d(3)}: announce to ${lowerFirst(crowd)} — post + email.`,
        `${d(5)}: one reminder to people who opened but didn't try it.`,
        `${d(7)}: count the result and write down the top three things people said.`,
      ]) },
      { heading: "Personal message (text or DM)", body: personal },
      { heading: "Social post", body: post },
      { heading: "Email", body: email },
      { heading: "Result to count", body: `${upperFirst(stripEnd(target))} by ${d(7)}. Hit it → keep going and ask those people who else should see it. Missed it → look at where people stopped, and fix that before announcing wider.` },
    ],
    assumptions,
    unknowns,
    prompt: { label: "Announcement post", text: post },
    limitation: what ? undefined : "Nothing to launch was described. Say what it is and regenerate.",
  };
}

// ---- GROW -------------------------------------------------------------------

type Stall = "conversion" | "retention" | "traffic" | "activation";

function stallOf(text: string): Stall {
  if (has(text, /come back|return|retention|churn|once and|never again|don'?t return|one.?time|stop using/)) return "retention";
  if (has(text, /not enough (people|visitors|traffic)|no one (finds|knows|visits)|nobody (finds|knows|visits)|traffic|visibility|find (it|us)|discover/)) return "traffic";
  if (has(text, /sign ?up|buy|purchase|checkout|cart|subscribe|pay|convert|leave the page|bounce|don'?t (buy|sign)/)) return "conversion";
  return "activation";
}

function ratio(text: string): { a: number; b: number } | null {
  const nums = (text.match(/\d[\d,]*/g) ?? []).map((n) => Number(n.replace(/,/g, ""))).filter((n) => n > 0);
  if (nums.length < 2) return null;
  const [x, y] = nums;
  return x >= y ? { a: y, b: x } : { a: x, b: y };
}

export function growArtifact(a: Answers): EngineArtifact {
  const measure = lowerFirst(stripEnd(known(a, "measure").split(/\s*[;\n]\s*|\s+—\s+|\s+-\s+/)[0]));
  const who = known(a, "who");
  const bottleneck = known(a, "bottleneck");
  const evidence = known(a, "evidence");
  const guess = known(a, "guess");
  const stall = stallOf(`${bottleneck} ${measure} ${evidence}`);
  const name = known(a, "name") || shortName(measure ? `Grow ${measure}` : "Growth experiment");
  const r = ratio(evidence);
  const baseline = r ? `${r.a} of ${r.b} (${Math.round((r.a / r.b) * 1000) / 10}%)` : "";
  const assumptions: string[] = [];
  const unknowns: string[] = [];
  const plays: Record<Stall, { change: string; because: string }> = {
    conversion: { change: "Rewrite the first screen so the top line says exactly what they get and the button says the result (\"Get my plan\" not \"Submit\"); remove every other link from that screen.", because: "most people decide in a few seconds and leave when the next step isn't obvious" },
    retention: { change: "Give people a reason to return: at the end of the first use, ask for their email to send one useful follow-up (their result, a reminder, the next step) two days later.", because: "people who got value once rarely remember to come back without a nudge" },
    traffic: { change: "Pick ONE place your people already gather (a group, forum, newsletter, or local board) and post something genuinely useful there twice a week, with your link at the end.", because: "one channel done consistently beats five done once" },
    activation: { change: "Cut the first-use path to its shortest version: remove every optional step before the first useful result, and show an example result before asking for anything.", because: "people stall when the first win takes too long" },
  };
  const play = guess ? { change: stripEnd(guess) + ".", because: "it's your best guess, and you know your people" } : plays[stall];
  if (!guess) assumptions.push(`The change to test: ${lowerFirst(play.change)} — the standard first move when the problem is ${stall}.`);
  if (!baseline) unknowns.push(`Your starting number. Before changing anything, write down this week's ${measure || "number"} — without it you can't tell if the test worked.`);
  const target = r ? `${Math.max(r.a + 1, Math.ceil(r.a * 1.3))} of ${r.b} (a 30% lift)` : "30% better than your starting number";

  return {
    engineId: "grow",
    kind: "Growth experiment",
    title: name,
    summary: `One experiment to move ${measure || "your number"}: the change, how long to run it, what counts as a win, and what to do with either result.`,
    nextAction: baseline ? `Make the change below today, and note the date — the two weeks start now.` : `Write down this week's ${measure || "number"} before you change anything.`,
    sections: [
      { heading: "Where it's stuck", body: `${upperFirst(stall)}: ${bottleneck ? stripEnd(bottleneck) : `people aren't reaching ${measure || "the result"}`}.${who ? ` The people: ${stripEnd(who)}.` : ""}` },
      { heading: "The experiment", body: [`If we ${lowerFirst(play.change.replace(/\.$/, ""))}, then ${measure || "the number"} goes up, because ${play.because}.`, "", `Run it for two weeks. Change nothing else while it runs.`].join("\n") },
      { heading: "How to read the result", body: bullets([
        baseline ? `Starting point: ${baseline}.` : "Starting point: this week's number, written down before the change.",
        `Win: ${target} or better → keep the change, then test the next stall.`,
        "Flat (within ±10%): the change didn't matter — undo it and test the next idea on the list.",
        "Worse: undo it today.",
      ]) },
      { heading: "If this doesn't move it, test next", body: numbered(Object.entries(plays).filter(([k]) => k !== stall).map(([, v]) => v.change)) },
    ],
    assumptions,
    unknowns,
    limitation: measure || bottleneck ? undefined : "No number or sticking point was given, so this is a generic first-use experiment. Say what number you want to move and where people stop.",
  };
}
