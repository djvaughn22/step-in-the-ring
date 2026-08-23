// Where a finished plan goes next.
//
// Hard rule: only recommend an engine whose flow actually works for the person
// reading the page. Sending someone into a placeholder — or into a tool that
// only runs on the owner's machine — is worse than no recommendation, because
// they trust it and lose the plan.

import type { Interpretation } from "./types";

export type EngineHandoff = {
  engineId: string;
  name: string;
  route: string;
  why: string;
  /** Structured data carried into the destination — never discard the plan. */
  seed: () => void;
};

const BUILD_SEED_KEY = "sitr-build-seed";
const ENGINE_SEED_KEY = "sitr-engine-seed";

/** Carry the interpreted plan into the destination engine. */
function seedEngine(engineId: string, i: Interpretation) {
  return () => {
    try {
      window.localStorage.setItem(
        ENGINE_SEED_KEY,
        JSON.stringify({ engineId, title: i.title.value, summary: i.summary, raw: i.raw, at: Date.now() }),
      );
    } catch {}
  };
}

/** The beginner workflow reads { appName, purpose } once, then forgets it. */
function seedBuild(i: Interpretation) {
  return () => {
    try {
      window.localStorage.setItem(
        BUILD_SEED_KEY,
        JSON.stringify({ appName: i.title.value, purpose: i.summary }),
      );
    } catch {}
  };
}

const MUSIC = /\b(song|beat|music|track|album|melody|chord|lyrics|producer|mpk|daw)\b/i;
const GAME = /\b(game|arcade|puzzle|action|puzzle game|board game|card game|casino|sports game|strategy game|rpg|role.playing|minigame|mini game)\b/i;

export function recommendEngine(i: Interpretation): EngineHandoff | null {
  const text = `${i.raw} ${i.summary}`;

  if (i.buildType.value === "explore") {
    return {
      engineId: "idea",
      name: "Idea Engine",
      route: "/engines/room?engine=idea",
      why: "It's still an early thought — the Idea Engine weighs a few versions and helps you pick one.",
      seed: seedEngine("idea", i),
    };
  }

  if (MUSIC.test(text) && i.shape === "content") {
    return {
      engineId: "music",
      name: "Music Engine",
      route: "/engines/room?engine=music",
      why: "It walks you to a real exported audio file with free tools.",
      seed: seedEngine("music", i),
    };
  }

  if (GAME.test(text)) {
    return {
      engineId: "game",
      name: "Game Engine",
      route: "/engines/room?engine=game",
      why: "Pick a game template, shape your world, play it live, and publish it.",
      seed: seedEngine("game", i),
    };
  }

  if (i.buildType.value === "sell" || i.shape === "product") {
    return {
      engineId: "design-shop",
      name: "Design Shop",
      route: "/engines/room?engine=design-shop",
      why: "It takes a product idea to a design package and an Etsy listing draft.",
      seed: seedEngine("design-shop", i),
    };
  }

  // A first web app, from scratch, by someone who hasn't done it before.
  if (i.buildType.value === "new" && !i.destination) {
    return {
      engineId: "build",
      name: "Build your first web app",
      route: "/build",
      why: "Six guided rounds from idea to a live site — made for a first build.",
      seed: seedBuild(i),
    };
  }

  // Adding to or fixing an existing product: the builder prompt IS the handoff.
  return null;
}
