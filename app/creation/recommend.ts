// Engine recommendation — one primary, up to two honest alternates.
//
// Hard rules carried over from the planner's handoff.ts:
//  - Only recommend engines whose flow actually works for the person reading
//    the page (activation working/beta). The Game Engine is owner-only, so a
//    game idea routes to the Build Engine with a game specification — and we
//    SAY that the Game Engine exists but publishes only from the owner's
//    machine. Honesty beats tidiness.
//  - Not every creation gets an engine. "The builder prompt is the handoff"
//    is a legitimate primary path and is presented as one.

import { getEngine } from "../engines/engines";
import type { CreationView } from "./record";

export interface EngineChoice {
  engineId: string;
  name: string;
  route: string;
  why: string;
}

export interface Recommendation {
  /** The best next engine — or null when the builder prompt IS the path. */
  primary: EngineChoice | null;
  /** Why the prompt path is primary, when it is. */
  promptPathWhy?: string;
  alternates: EngineChoice[];
}

function choice(engineId: string, why: string): EngineChoice | null {
  const e = getEngine(engineId);
  if (!e || e.hidden) return null;
  // Never send a visitor into an engine that errors for them.
  if (e.activation === "owner-only" || e.activation === "planned" || e.activation === "unavailable") return null;
  return { engineId, name: e.name, route: `/engines?engine=${engineId}`, why };
}

const push = (arr: EngineChoice[], c: EngineChoice | null) => { if (c) arr.push(c); };

const SOFTWAREISH = new Set(["app", "site", "tool", "list"]);

export function recommendEngines(v: CreationView): Recommendation {
  const alternates: EngineChoice[] = [];
  const i = v.interpretation;

  // Still an early thought → sharpen before building anything. A KNOWN
  // creation type outranks vagueness — a mug idea is a mug idea even when
  // it's only eight words long.
  if (v.creationType === "unknown" || (i.buildType.value === "explore" && SOFTWAREISH.has(v.creationType))) {
    push(alternates, choice("sell", "If it's really something to sell, this shapes the offer."));
    return {
      primary: choice("idea", "It's still an early thought — weigh a few versions and leave with one decision."),
      alternates,
    };
  }

  switch (v.creationType) {
    case "design":
    case "printable":
    case "digital-product":
    case "physical-product":
      push(alternates, choice("sell", "Skips design and goes straight to the offer and first validation."));
      push(alternates, choice("idea", "If you're torn between versions of the product, decide first."));
      return {
        primary: choice("design-shop", "It takes a product idea to a design package and a listing draft — the whole road."),
        alternates,
      };

    case "music":
      push(alternates, choice("idea", "If the song is one of several ideas, pick first."));
      return {
        primary: choice("music", "It walks you to a real exported audio file with free tools."),
        alternates,
      };

    case "game": {
      push(alternates, choice("idea", "If the game concept is fuzzy, sharpen it into one version first."));
      return {
        primary: choice("build", "You leave with a game specification and a builder prompt aimed at the smallest playable version."),
        alternates,
      };
    }

    case "service":
      push(alternates, choice("sell", "Turns the service into an offer someone can say yes to."));
      return {
        primary: choice("plan", "A service is delivery steps, boundaries and a first customer — that's a plan, not code."),
        alternates,
      };

    case "event-plan":
      return {
        primary: choice("plan", "It turns a real-world effort into phases, owners and the next concrete action."),
        alternates,
      };

    case "story":
    case "content":
      push(alternates, choice("idea", "Weigh a few versions of the piece and pick the one to finish."));
      push(alternates, choice("sell", "If the piece is meant to earn, shape the offer around it."));
      return {
        primary: null,
        promptPathWhy: "There's no Story Engine yet (it's planned, honestly not built). Your builder prompt below is the real path — it's written for the piece itself, not for an app.",
        alternates,
      };

    default: {
      // Software: app / site / tool / list.
      if (i.buildType.value === "fix" && i.destination) {
        push(alternates, choice("fix", "A guided repair cycle with regression checks, if you want the fuller package."));
        return {
          primary: null,
          promptPathWhy: "Something real is broken — the repair prompt below inspects before it edits. Copy it into your builder.",
          alternates,
        };
      }
      if (i.buildType.value === "sell") {
        push(alternates, choice("design-shop", "If what's being sold is a designed product, this makes the package."));
        return { primary: choice("sell", "It turns this into an offer someone can actually buy."), alternates };
      }
      if (i.buildType.value === "new" && !i.destination) {
        push(alternates, choice("build", "The fuller build brief, if you've shipped something before."));
        return {
          primary: {
            engineId: "first-build",
            name: "Build your first web app",
            route: "/build",
            why: "Six guided rounds from idea to a live site — made for a first build.",
          },
          alternates,
        };
      }
      // Adding to / improving an existing product: the prompt is the handoff.
      push(alternates, choice("build", "A fuller build brief for the same work, if you want more structure."));
      return {
        primary: null,
        promptPathWhy: "This lands in something that already exists — the builder prompt below carries the whole plan. Copy it into the tool you trust.",
        alternates: alternates.slice(0, 2),
      };
    }
  }
}
