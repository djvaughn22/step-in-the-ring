// Creation-system acceptance fixtures. Every expectation here runs through
// the SAME code path the app uses — no hand-written demonstration output.
import { describe, expect, it } from "vitest";
import { adapterFor, adapterForType, engineFit } from "./adapters";
import { DEFAULT_BUILDER_DEFAULTS, doctrineLines } from "./builder-defaults";
import { buildPackJson, buildPackMarkdown } from "./build-pack";
import { encodeHandoff, handoffToIntake, readHandoffFromSearch, recordToIntake } from "./handoff";
import { recommendEngines } from "./recommend";
import {
  moveToEngine, newRecord, recordFromEngineIntake, recordFromHandoff, viewOf, withAnswers,
} from "./record";
import { parseCreationRecord, parseHandoffPayload, type HandoffPayloadV1 } from "./types";

const D = DEFAULT_BUILDER_DEFAULTS;

/* ── 1. The dog-boredom idea (problem-solving, software optional-ish) ──── */
describe("dog boredom — the acceptance example", () => {
  const record = newRecord("I want to solve dog boredom. Keep a dog busy and entertained.", {
    sourceFlow: "planner",
  });
  const v = viewOf(record);

  it("reads the caretaker as the user, not the dog", () => {
    expect(v.beneficiary).toBe("the dog");
    expect(v.primaryUser).toMatch(/looking after the dog/i);
    expect(v.primaryUser).toMatch(/busy|short on attention/i);
  });

  it("the smallest outcome is the dog occupied with low setup, not an app feature list", () => {
    expect(v.smallestOutcome).toMatch(/occupied/i);
    expect(v.smallestOutcome).toMatch(/no setup|almost no setup/i);
  });

  it("version one is one fast matched answer, not activity cards + a timer", () => {
    expect(v.versionOnePromise).toMatch(/ONE matching suggestion/);
    expect(v.versionOnePromise).toMatch(/quick questions/i);
    expect(v.versionOnePromise).not.toMatch(/timer/i);
  });

  it("software is honest: helpful, with a printable test first", () => {
    expect(v.software.verdict).toBe("helpful");
    expect(v.software.nonSoftwareTest).toMatch(/paper|cards/i);
  });

  it("carries safety constraints without diagnosing", () => {
    expect(v.safetyConstraints.join(" ")).toMatch(/supervision/i);
    expect(v.safetyConstraints.join(" ")).toMatch(/never diagnose/i);
  });

  it("the generated App prompt is specific to this creation", () => {
    const prompt = adapterForType(v.creationType).prompt(v, D);
    expect(prompt).toContain("solve dog boredom");           // original words preserved
    expect(prompt).toMatch(/ONE matching suggestion/);
    expect(prompt).toMatch(/supervision/i);
    expect(prompt).toMatch(/no database in version one/i);
    expect(prompt).not.toMatch(/subscriptions|leaderboard/i);
  });

  it("is NOT dog-hard-coded: a toddler version takes the same path", () => {
    const t = viewOf(newRecord("Something to keep a toddler entertained on car rides."));
    expect(t.beneficiary).toBe("the toddler");
    expect(t.primaryUser).toMatch(/looking after the toddler/i);
  });
});

/* ── 2. A game arriving from iDontCry's Game Lab ───────────────────────── */
describe("iDontCry game handoff", () => {
  const payload: HandoffPayloadV1 = {
    v: 1, source: "idontcry", flow: "game-lab",
    idea: "A game where you stack pancakes before they slide off the plate",
    title: "Pancake Stack",
    typeHint: "game",
    facts: { player: "my kids", goal: "stack 20 pancakes without a topple" },
  };

  it("survives encode → URL → decode intact", () => {
    const encoded = encodeHandoff(payload);
    expect(encoded).toBeTruthy();
    const back = readHandoffFromSearch(`?cr=${encoded}`);
    expect(back).not.toBeNull();
    expect(back!.idea).toBe(payload.idea);
    expect(back!.facts!.player).toBe("my kids");
    expect(back!.typeHint).toBe("game");
  });

  it("stays a game with its player, goal and origin", () => {
    const v = viewOf(recordFromHandoff(payload));
    expect(v.creationType).toBe("game");
    expect(v.record.source).toBe("idontcry");
    expect(v.record.sourceFlow).toBe("game-lab");
    expect(v.record.originalIdea).toBe(payload.idea);
  });

  it("the game prompt talks loops and win states, never a productivity app", () => {
    const v = viewOf(recordFromHandoff(payload));
    const prompt = adapterForType(v.creationType).prompt(v, D);
    expect(prompt).toMatch(/Core loop/i);
    expect(prompt).toMatch(/Win state/i);
    expect(prompt).toMatch(/Smallest playable proof/i);
    expect(prompt).toContain("my kids");
    expect(prompt).toContain("stack 20 pancakes");
    expect(prompt).toMatch(/Accounts, currencies/);
  });
});

/* ── 3. Direct engine-room game + idea-first/engine-first equivalence ──── */
describe("engine-first entry", () => {
  it("a game through engine-room intake gets the same reading as idea-first", () => {
    const ideaFirst = viewOf(newRecord("A memory game with animal cards you flip in pairs."));
    const engineFirst = viewOf(
      recordFromEngineIntake("build", { purpose: "A memory game with animal cards you flip in pairs.", name: "Pairs" }),
    );
    expect(ideaFirst.creationType).toBe("game");
    expect(engineFirst.creationType).toBe("game");
    expect(engineFirst.software.verdict).toBe(ideaFirst.software.verdict);
  });

  it("engineFit flags a design idea inside the build engine without blocking", () => {
    const v = viewOf(recordFromEngineIntake("build", { purpose: "A funny dog dad t-shirt design to sell on Etsy." }));
    const fit = engineFit("build", v);
    expect(fit.fits).toBe(false);
    expect(fit.better).toBe("design-shop");
    expect(fit.note).toMatch(/can still be built here/i);
  });
});

/* ── Fix and Plan Engine handoff → real intake keys, not "rough"/"idea" ───
   Create only ever routes to a handful of generic-intake engines
   (app/creation/recommend.ts): build, sell, design-shop, fix, plan. The
   first three had a handoffToIntake case; fix and plan fell through to
   `default`'s {rough, idea} — keys that match no real question on either
   engine (Fix's first field is "symptom", Plan's is "outcome"), so the
   record arrived at the engine but rendered as an untouched, empty wizard.
   This is the actual "no retyping" contract for two of the sprint's three
   required engine flows, exercised through the real Create pipeline. */
describe("Create -> Fix Engine carries the report forward, not retyped", () => {
  const view = viewOf(newRecord("The login on my app stopped working after the last change."));

  it("the engine choice is honestly the repair prompt path, with Fix as the fuller option", () => {
    const rec = recommendEngines(view);
    expect(rec.primary).toBeNull();
    expect(rec.alternates.map((a) => a.engineId)).toContain("fix");
  });

  it("recordToIntake fills Fix's actual first question — symptom — not rough/idea", () => {
    const intake = recordToIntake("fix", view.record);
    expect(intake.symptom).toBe(view.record.originalIdea);
    expect(intake.rough).toBeUndefined();
  });
});

describe("Create -> Plan Engine carries the goal forward, not retyped", () => {
  const view = viewOf(newRecord("Plan a neighborhood fundraiser with volunteers, deadlines, and donations."));

  it("Plan Engine is the honest primary recommendation", () => {
    expect(recommendEngines(view).primary?.engineId).toBe("plan");
  });

  it("recordToIntake fills Plan's actual first question — outcome — not rough/idea", () => {
    const intake = recordToIntake("plan", view.record);
    expect(intake.outcome).toBe(view.record.originalIdea);
    expect(intake.rough).toBeUndefined();
  });
});

/* ── Dream Shop handoff → Design Shop prefill ───────────────────────── */
describe("dream shop handoff", () => {
  const payload: HandoffPayloadV1 = {
    v: 1, source: "idontcry", flow: "dream-shop",
    idea: "Dog Dad Delivery Inspector — sticker of a dog inspecting packages",
    typeHint: "design",
    engineHint: "design-shop",
    facts: { vibe: "Funny", productType: "Sticker", audience: "Dog Lovers", spark: "every delivery is his" },
  };

  it("prefills the Design Shop intake — no duplicate questions", () => {
    const intake = handoffToIntake("design-shop", payload);
    expect(intake.idea).toBe(payload.idea);
    expect(intake.customer).toBe("Dog Lovers");
    // Dream Shop names map onto this intake's real select options.
    expect(intake.productType).toBe("Sticker Sheet");
    expect(intake.spark).toBe("every delivery is his");
  });

  it("the design spec is about deliverables, not web apps", () => {
    const v = viewOf(recordFromHandoff(payload));
    expect(["design", "printable"]).toContain(v.creationType);
    const prompt = adapterForType(v.creationType).prompt(v, D);
    expect(prompt).toMatch(/Dimensions & format/i);
    expect(prompt).toMatch(/mockup/i);
    // No app-spec sections — the doctrine's "no databases" prohibition is fine.
    expect(prompt).not.toMatch(/States that must exist|Empty state|Primary flow/);
  });
});

/* ── 5. Non-software creations get non-software specs ──────────────────── */
describe("non-software honesty", () => {
  it("a service is proven by delivery, not code", () => {
    const v = viewOf(newRecord("A dog-walking service for busy neighbors on my street."));
    expect(v.creationType).toBe("service");
    expect(v.software.verdict).toBe("test-first");
    // The caretaker read never hijacks a service — its outcome is a delivery.
    expect(v.smallestOutcome).toMatch(/delivery/i);
    expect(v.beneficiary).toBeNull();
    const prompt = adapterForType(v.creationType).prompt(v, D);
    expect(prompt).toMatch(/Deliver it manually/i);
    expect(prompt).not.toMatch(/States that must exist|Empty state|Primary flow/);
  });

  it("a story never gets a database", () => {
    const v = viewOf(newRecord("A children's book about a raccoon who is scared of recycling day."));
    expect(v.creationType).toBe("story");
    const prompt = adapterForType(v.creationType).prompt(v, D);
    expect(prompt).toMatch(/premise|character/i);
    // The "this is writing, not software" guard — wording may evolve, the
    // promise (nothing to build/install) must not.
    expect(prompt).toMatch(/nothing to build|nothing to install|not an app/i);
  });

  it("explicit software request is honoured but the cheaper test is shown", () => {
    const v = viewOf(newRecord("Build me a website to sell my printable chore charts."));
    expect(v.software.explicitSoftwareRequest).toBe(true);
    expect(["optional", "test-first"]).toContain(v.software.verdict);
    expect(v.recommendations.join(" ")).toMatch(/non-software test/i);
  });
});

/* ── 6. A vague idea ───────────────────────────────────────────────────── */
describe("vague ideas", () => {
  it("routes to the Idea Engine instead of pretending it's defined", () => {
    const v = viewOf(newRecord("maybe something for people somehow"));
    const rec = recommendEngines(v);
    expect(rec.primary?.engineId).toBe("idea");
  });
});

/* ── 7. Requirements + exclusions survive everything ───────────────────── */
describe("preserving the creator's limits", () => {
  it("explicit exclusions appear in view facts and every prompt", () => {
    const r = newRecord("A workout tracker for my brother.", { exclusions: ["No accounts", "No social features"] });
    const v = viewOf(r);
    expect(v.facts.join(" ")).toContain("No accounts");
    const prompt = adapterForType(v.creationType).prompt(v, D);
    expect(prompt).toContain("No accounts");
    expect(prompt).toContain("No social features");
    expect(prompt).toMatch(/out of scope/i);
  });

  it("engine chaining keeps answers and never re-asks", () => {
    let r = newRecord("A recipe box app for my mom.", { engineId: "idea" });
    r = withAnswers(r, {
      audience: "My mom, who cooks from paper cards",
      versionOne: "She adds a recipe and finds it again by name.",
    });
    r = moveToEngine(r, "build", "decided to build it");
    expect(r.answers.audience).toBe("My mom, who cooks from paper cards");
    expect(r.journey.map((j) => j.engineId)).toEqual(["idea", "build"]);
    expect(r.originalIdea).toBe("A recipe box app for my mom.");
    // The interpretation still sees the answer — no duplicate question needed.
    const v = viewOf(r);
    expect(v.interpretation.openQuestions).toHaveLength(0);
  });
});

/* ── 8. Materially different outputs across engines ────────────────────── */
describe("engines differ for real", () => {
  const v = viewOf(newRecord("A tool that helps teachers pick a five-minute class activity."));

  it("spec sections differ across adapters, not just headings", () => {
    const app = adapterFor("build")!.spec(v).flatMap((s) => s.lines).join("\n");
    const sell = adapterFor("sell")!.spec(v).flatMap((s) => s.lines).join("\n");
    const grow = adapterFor("grow")!.spec(v).flatMap((s) => s.lines).join("\n");
    expect(app).toMatch(/Empty state/i);
    expect(sell).toMatch(/Price hypothesis/i);
    expect(grow).toMatch(/decision rule/i);
    expect(app).not.toBe(sell);
    expect(sell).not.toBe(grow);
  });

  it("prompts differ materially too", () => {
    const p1 = adapterFor("build")!.prompt(v, D);
    const p2 = adapterFor("plan")!.prompt(v, D);
    expect(p1).toMatch(/States that must exist/i);
    expect(p2).toMatch(/phases/i);
    expect(p1).not.toBe(p2);
  });
});

/* ── 9. Handoff validation: malformed, oversize, legacy ────────────────── */
describe("handoff contract safety", () => {
  it("rejects malformed payloads quietly", () => {
    expect(readHandoffFromSearch("?cr=notjson")).toBeNull();
    expect(readHandoffFromSearch(`?cr=${encodeURIComponent(JSON.stringify({ v: 2, idea: "x" }))}`)).toBeNull();
    expect(readHandoffFromSearch(`?cr=${encodeURIComponent(JSON.stringify({ v: 1, source: "evil", flow: "dream-lab", idea: "x" }))}`)).toBeNull();
    expect(parseHandoffPayload({ v: 1, source: "idontcry", flow: "dream-lab", idea: "" })).toBeNull();
  });

  it("refuses to emit an oversized payload instead of truncating silently", () => {
    const big: HandoffPayloadV1 = {
      v: 1, source: "idontcry", flow: "dream-lab", idea: "x".repeat(1900),
    };
    expect(encodeHandoff(big)).toBeNull();
  });

  it("record parse round-trips and rejects junk", () => {
    const r = newRecord("A tiny site for the block party.", { exclusions: ["no payments"] });
    const back = parseCreationRecord(JSON.parse(JSON.stringify(r)));
    expect(back).not.toBeNull();
    expect(back!.originalIdea).toBe(r.originalIdea);
    expect(back!.exclusions).toEqual(["no payments"]);
    expect(parseCreationRecord({ schemaVersion: 99 })).toBeNull();
    expect(parseCreationRecord("nope")).toBeNull();
  });
});

/* ── 10. Recommendations ───────────────────────────────────────────────── */
describe("engine recommendations", () => {
  it("a product idea goes to the Design Shop with honest alternates", () => {
    const v = viewOf(newRecord("Funny coffee mugs for nurses on night shift."));
    const rec = recommendEngines(v);
    expect(rec.primary?.engineId).toBe("design-shop");
    expect(rec.alternates.length).toBeGreaterThan(0);
    expect(rec.alternates.length).toBeLessThanOrEqual(2);
  });

  it("a game routes straight to the Game Engine", () => {
    // Superseded 2026-08-24: the Game Engine's "new game idea" path is
    // fully client-side and works for anyone, so a game idea no longer
    // detours through the Build lane. See app/engines/games/GameStudio.tsx.
    const v = viewOf(newRecord("A word game where you guess the missing lyric."));
    const rec = recommendEngines(v);
    expect(rec.primary?.engineId).toBe("game");
  });

  it("a story routes to the Writing Engine, not a dead end", () => {
    const v = viewOf(newRecord("A short story about my grandpa's fishing boat."));
    const rec = recommendEngines(v);
    expect(rec.primary?.engineId).toBe("writing");
  });
});

/* ── 11. Build Pack exports ────────────────────────────────────────────── */
describe("build pack", () => {
  const v = viewOf(newRecord("I want to solve dog boredom. Keep a dog busy and entertained."));
  const prompt = adapterForType(v.creationType).prompt(v, D);

  it("markdown carries idea, interpretation, spec, prompt, history", () => {
    const md = buildPackMarkdown(v, prompt);
    expect(md).toContain("word for word");
    expect(md).toContain("solve dog boredom");
    expect(md).toMatch(/Version-one promise/);
    expect(md).toMatch(/The builder prompt/);
    expect(md).toMatch(/Creation history/);
  });

  it("json is the validated record, re-importable", () => {
    const parsed = JSON.parse(buildPackJson(v));
    expect(parsed.kind).toBe("sitr-creation");
    expect(parseCreationRecord(parsed.record)).not.toBeNull();
  });
});

/* ── 12. Builder defaults shape every prompt ───────────────────────────── */
describe("builder defaults", () => {
  it("prototype mode forbids commits; push mode forbids manual deploys", () => {
    expect(doctrineLines({ ...D, gitMode: "prototype" }, "central").join(" ")).toMatch(/do not commit/i);
    const push = doctrineLines({ ...D, gitMode: "build-commit-push" }, "central").join(" ");
    expect(push).toMatch(/then push/i);
    expect(push).toMatch(/Do not manually deploy/i);
  });

  it("existing-repo mode inspects before editing", () => {
    const v = viewOf(newRecord("Add a dark mode to my recipe site."));
    const p = adapterForType(v.creationType).prompt(v, { ...D, workMode: "existing-repo" });
    expect(p).toMatch(/Inspect before editing/i);
  });
});

/* ── 13. Working method fits the creation, not just software ────────────
   doctrineLines() used to be the same software-development checklist
   (existing codebase, mobile-first UI, git commits, type checking) on
   EVERY prompt, regardless of what was actually being made — a song or a
   letter got told to be mobile-first and to inspect a codebase. The real,
   already-computed signal for "does this need software" is
   SoftwareVerdict (app/creation/types.ts); doctrineLines now branches on
   it instead of assuming software every time. */
const SOFTWARE_ONLY_PHRASES = [
  /existing codebase/i,
  /mobile-first/i,
  /touch targets/i,
  /type checking/i,
  /production build/i,
  /\bcommit\b/i,
  /\brepository\b/i,
];

function expectNoSoftwareLeak(prompt: string) {
  for (const phrase of SOFTWARE_ONLY_PHRASES) expect(prompt).not.toMatch(phrase);
}

describe("working method matches the creation, not a fixed software checklist", () => {
  it("software (an app): software verdict is central, and software working method is appropriate", () => {
    const v = viewOf(newRecord("I want to make an app that tracks my kids' chores."));
    expect(v.software.verdict).toBe("central");
    const p = adapterForType(v.creationType).prompt(v, D);
    expect(p).toMatch(/existing codebase/i);
    expect(p).toMatch(/mobile-first/i);
  });

  it("a song: no existing-codebase or mobile-first language", () => {
    const v = viewOf(newRecord("I want to write a song about missing summer when winter comes."));
    expect(v.creationType).toBe("music");
    expect(v.software.verdict).not.toBe("central");
    expectNoSoftwareLeak(adapterForType(v.creationType).prompt(v, D));
  });

  it("a poem: no software leakage", () => {
    const v = viewOf(newRecord("I want to write a poem about the sea at night."));
    expect(v.creationType).toBe("story");
    expect(v.software.verdict).not.toBe("central");
    expectNoSoftwareLeak(adapterForType(v.creationType).prompt(v, D));
  });

  it("a letter: no software leakage", () => {
    // "letter" was added to classify.ts's STORY signal in the front-door
    // broadening checkpoint (2026-08-30) — it used to read as "unknown"
    // and get routed to the Idea Engine's "weigh a few versions" framing,
    // which made no sense for a letter with a clear, known purpose.
    const v = viewOf(newRecord("I want to write a letter to my landlord about the broken heater."));
    expect(v.creationType).toBe("story");
    expect(v.software.verdict).not.toBe("central");
    expectNoSoftwareLeak(adapterForType(v.creationType).prompt(v, D));
  });

  it("a real-world plan (event-plan): no software leakage", () => {
    const v = viewOf(newRecord("I need to plan a family reunion trip for next summer."));
    expect(v.creationType).toBe("event-plan");
    expect(v.software.verdict).not.toBe("central");
    expectNoSoftwareLeak(adapterForType(v.creationType).prompt(v, D));
  });

  it("non-software prompts still get a real, honest working method — not an empty section", () => {
    const v = viewOf(newRecord("I want to write a song about missing summer when winter comes."));
    const p = adapterForType(v.creationType).prompt(v, D);
    expect(p).toMatch(/## Working method/);
    expect(p).toMatch(/Use or experience the finished piece yourself before calling it done\./);
  });

  // The same identical leak lived one section higher: "Scope and
  // permissions" told every creation to "Start clean... do not assume
  // access to any codebase" — including this exact song, live-verified in
  // the browser before this fix. Same verdict-based fix as doctrineLines.
  it("the Scope and permissions section doesn't assume a codebase either, for non-software work", () => {
    const v = viewOf(newRecord("I want to write a song about missing summer when winter comes."));
    const p = adapterForType(v.creationType).prompt(v, D);
    expect(p).toMatch(/## Scope and permissions/);
    expect(p).not.toMatch(/codebase/i);
    expect(p).toMatch(/Start fresh\. Nothing about this exists yet/);
  });

  it("software still gets the codebase-aware scope language", () => {
    const v = viewOf(newRecord("I want to make an app that tracks my kids' chores."));
    const p = adapterForType(v.creationType).prompt(v, D);
    expect(p).toMatch(/Start clean\. Nothing exists yet — do not assume access to any codebase/);
  });

  it("doctrineLines() itself branches on verdict, independent of any adapter", () => {
    const software = doctrineLines(D, "central").join(" ");
    expect(software).toMatch(/existing codebase|Inspect before editing/i);
    for (const verdict of ["helpful", "optional", "test-first"] as const) {
      const general = doctrineLines(D, verdict).join(" ");
      for (const phrase of SOFTWARE_ONLY_PHRASES) expect(general).not.toMatch(phrase);
    }
  });
});
