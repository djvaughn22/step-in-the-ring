// Quality fixtures — the product standard, executed.
//
// 75+ varied creations run through the REAL interpretation and adapter paths
// (newRecord → viewOf → adapterForType → spec/prompt → recommendEngines).
// Every fixture must come out the other side with expert, entity-appropriate
// direction — never a reorganised echo of what went in.
//
// Global invariants (every fixture):
//  - a real classification and a non-empty smallest outcome / v1 promise
//  - the prompt keeps the creator's exact words AND adds substance beyond them
//  - honest tools/setup/automation guidance is present
//  - explicit exclusions survive into the prompt
// Per-fixture expectations pin the type, the specialist, the expert content
// that MUST appear, and the wrong-world content that must NOT.

import { describe, expect, it } from "vitest";
import { adapterForType } from "./adapters";
import { DEFAULT_BUILDER_DEFAULTS } from "./builder-defaults";
import { newRecord, viewOf } from "./record";
import { recommendEngines } from "./recommend";
import type { CreationType } from "./types";

interface Fixture {
  name: string;
  idea: string;
  answers?: Record<string, string>;
  exclusions?: string[];
  /** Acceptable creation types (an idea can honestly read two ways). */
  type: CreationType | CreationType[];
  /** Expected adapter id from adapterForType, when it matters. */
  adapter?: string;
  /** Expected primary engine rec: an id, null for the prompt path, undefined = don't check. */
  engine?: string | null;
  /** Must appear in the spec+prompt text (expert content, not echo). */
  contains?: (string | RegExp)[];
  /** Must NOT appear in the ADAPTER SPEC (wrong-world output). */
  bans?: (string | RegExp)[];
}

const F: Fixture[] = [
  /* ── The canonical caretaker case ── */
  {
    name: "dog boredom",
    idea: "Something to keep my dog busy and entertained when I'm working from home.",
    type: ["tool", "unknown"],
    contains: [/looking after the dog/i, /suggestion/i],
    bans: [/screenplay|chorus|playbook/i],
  },
  {
    name: "toddler waiting-room helper",
    idea: "Keep my toddler entertained at the doctor's office without a screen if possible.",
    type: ["tool", "unknown"],
    contains: [/looking after the toddler/i],
  },

  /* ── Software, honestly sized ── */
  {
    name: "one-file HTML landing",
    idea: "A simple one-page HTML landing page for my lawn care business with my phone number.",
    type: "site",
    adapter: "build",
    contains: [/HTML/i, /phone/i],
    bans: [/chapter|chorus|drill/i],
  },
  {
    name: "web app",
    idea: "A web app where our book club logs what we read and votes on the next book.",
    type: ["app", "tool", "list", "site"],
    adapter: "build",
    contains: [/Empty state/i, /no database in version one/i],
  },
  {
    name: "mobile app idea",
    idea: "A mobile app that reminds me to water each plant on its own schedule.",
    type: ["app", "tool", "list"],
    adapter: "build",
    contains: [/app stores are a distribution decision/i],
  },
  {
    name: "dashboard",
    idea: "A dashboard showing our family's chore stats for the week.",
    type: ["app", "tool", "list"],
    adapter: "build",
    contains: [/data source/i],
  },
  {
    name: "API",
    idea: "An API that returns a random writing prompt each day.",
    type: ["app", "tool"],
    adapter: "build",
    contains: [/consumer/i],
  },
  {
    name: "spreadsheet-shaped job",
    idea: "A spreadsheet tool to split rent and utilities fairly between roommates.",
    type: ["tool", "app"],
    adapter: "build",
    contains: [/spreadsheet/i],
  },
  {
    name: "family planner",
    idea: "A weekly family planner app we can all see, so nobody double-books Saturdays.",
    type: ["app", "tool", "list"],
    adapter: "build",
  },
  {
    name: "watch list",
    idea: "A list app to track movies we want to watch, add one, cross one off.",
    type: "list",
    adapter: "build",
  },
  {
    name: "pet website",
    idea: "A one-page website for my dog with his photo and the socks he has stolen. I already have the photos.",
    type: "site",
    adapter: "build",
    contains: [/photos/i],
  },
  {
    name: "local business site",
    idea: "A website for my mom's bakery so people can see hours and the cake menu.",
    type: "site",
    engine: "first-build",
    contains: [/phone/i],
  },

  /* ── Repairs ── */
  {
    name: "broken login repair",
    idea: "The login on our club site is broken, members can't get in since last week. Don't touch the events page, it works.",
    type: ["site", "tool", "app"],
    contains: [/events page/i],
  },
  {
    name: "bad mobile layout repair",
    idea: "Fix the mobile layout on my recipe site — the buttons overflow the screen on phones.",
    type: ["site", "tool", "app"],
    contains: [/phone/i],
  },

  /* ── Games ── */
  {
    name: "browser game",
    idea: "A browser game where you dodge falling tacos and beat your friend's score.",
    type: "game",
    adapter: "game",
    engine: "build",
    contains: [/Core loop/i, /playable/i, /win/i],
    bans: [/Etsy|listing|chapter/i],
  },
  {
    name: "board game",
    idea: "A board game about gardening for family game night.",
    type: ["game", "printable"],
  },
  {
    name: "card game",
    idea: "A card game where you match chores to the family member who hates them most.",
    type: ["game", "printable"],
  },
  {
    name: "quiz game",
    idea: "A trivia quiz about our hometown with easy, medium, and hard difficulty.",
    type: "game",
    adapter: "game",
    contains: [/difficulty/i],
  },
  {
    name: "memory game",
    idea: "A memory game with animal cards you flip in pairs.",
    type: "game",
    adapter: "game",
    contains: [/feedback/i],
  },

  /* ── Sports — coach outputs, not app plans ── */
  {
    name: "football practice plan",
    idea: "A football practice plan for my son's 10U team, 90 minutes, two coaches.",
    type: "sports-plan",
    adapter: "sports-prompt",
    engine: null,
    contains: [/warm-up/i, /cue/i, /printable/i, /water and rest/i],
    bans: [/database|deploy|log ?in|route/i],
  },
  {
    name: "football playbook",
    idea: "A simple football playbook for a youth flag football team.",
    type: "sports-plan",
    adapter: "sports-prompt",
    contains: [/formation/i, /assignment/i],
    bans: [/database|deploy/i],
  },
  {
    name: "lacrosse drill plan",
    idea: "Lacrosse drills to fix our ground ball problem at practice.",
    type: "sports-plan",
    adapter: "sports-prompt",
    contains: [/ground ball/i, /progression/i],
    bans: [/database|deploy/i],
  },
  {
    name: "lacrosse team site",
    idea: "A website for my lacrosse team with the schedule and results.",
    type: "site",
    adapter: "build",
    contains: [/phone/i],
  },
  {
    name: "athlete development plan",
    idea: "An off-season development plan so my daughter gets a stronger lacrosse shot.",
    type: "sports-plan",
    adapter: "sports-prompt",
    contains: [/measurable/i, /week/i],
  },
  {
    name: "basketball practice",
    idea: "A basketball practice plan for beginners who have never played.",
    type: "sports-plan",
    adapter: "sports-prompt",
    contains: [/cue/i],
  },
  {
    name: "soccer drills",
    idea: "A soccer drill library for U8 kids, focused on first touch.",
    type: "sports-plan",
    adapter: "sports-prompt",
    contains: [/first touch/i],
  },
  {
    name: "stat tracker stays software",
    idea: "An app to track my basketball team's stats during games.",
    type: ["app", "tool", "list"],
    adapter: "build",
  },

  /* ── Music — music outputs, not software architecture ── */
  {
    name: "song",
    idea: "A song about my grandpa's old truck.",
    type: "music",
    adapter: "music",
    engine: "music",
    contains: [/hook/i, /tempo/i, /audio file/i],
    bans: [/route|database|deploy|accounts/i],
  },
  {
    name: "lyrics",
    idea: "Lyrics about leaving a small town, I'll find the melody later.",
    type: "music",
    adapter: "music",
    contains: [/lyric sheet/i, /out loud/i],
    bans: [/route|database/i],
  },
  {
    name: "album concept",
    idea: "An album about the four seasons of a friendship.",
    type: "music",
    adapter: "music",
    contains: [/track arc/i, /ONE/],
    bans: [/route|database/i],
  },
  {
    name: "music video",
    idea: "A music video for the song I recorded last month.",
    type: "music",
    adapter: "music",
    contains: [/shot/i, /location/i],
    bans: [/database/i],
  },
  {
    name: "playlist",
    idea: "A playlist for long night drives.",
    type: "music",
    adapter: "music",
    contains: [/order/i],
    bans: [/DAW|database/i],
  },
  {
    name: "performance plan",
    idea: "A setlist and performance plan for my first open mic.",
    type: "music",
    adapter: "music",
    contains: [/setlist/i, /transitions/i],
  },
  {
    name: "first beat",
    idea: "A beat with a heavy bassline I can rap over.",
    type: "music",
    adapter: "music",
    contains: [/tempo/i],
  },

  /* ── Writing — the form decides the structure ── */
  {
    name: "poem",
    idea: "A poem about my grandmother's garden after she passed.",
    type: "story",
    adapter: "writing-prompt",
    engine: null,
    contains: [/turn/i, /aloud/i, /image/i],
    bans: [/route|database|screen|deploy|dashboard/i],
  },
  {
    name: "novel",
    idea: "A novel about a lighthouse keeper who finds a message that changes everything.",
    type: "story",
    adapter: "writing-prompt",
    contains: [/chapter map/i, /premise/i, /central conflict/i],
    bans: [/route|database|deploy/i],
  },
  {
    name: "children's book",
    idea: "A children's book about a raccoon who is scared of recycling day.",
    type: "story",
    adapter: "writing-prompt",
    contains: [/read(?:ing it)? aloud/i, /age band/i, /spread/i],
    bans: [/route|database/i],
  },
  {
    name: "screenplay",
    idea: "A screenplay about two rival food truck owners forced to share a parking lot.",
    type: "story",
    adapter: "writing-prompt",
    contains: [/logline/i, /three acts/i, /scene/i, /protagonist/i],
    bans: [/route|database|deploy/i],
  },
  {
    name: "short story",
    idea: "A short story about the last phone booth in a small town.",
    type: "story",
    adapter: "writing-prompt",
    contains: [/premise/i, /character/i],
    bans: [/database/i],
  },
  {
    name: "wedding speech",
    idea: "A wedding toast for my best friend that's funny but lands somewhere real.",
    type: "story",
    adapter: "writing-prompt",
    contains: [/one message/i, /out loud/i],
    bans: [/database|premise/i],
  },
  {
    name: "blog",
    idea: "A blog about fixing up my 100-year-old house on a budget.",
    type: ["content", "story"],
    adapter: "writing-prompt",
    contains: [/promise/i, /three/i],
    bans: [/database/i],
  },
  {
    name: "newsletter",
    idea: "A weekly newsletter about under-the-radar local restaurants.",
    type: ["content", "story"],
    adapter: "writing-prompt",
    contains: [/cadence/i, /subscribers|reader/i],
    bans: [/database/i],
  },
  {
    name: "podcast",
    idea: "A podcast where I interview my neighbors about their first jobs.",
    type: ["content", "story"],
    adapter: "writing-prompt",
    contains: [/episode/i, /cadence/i],
    bans: [/database|premise/i],
  },
  {
    name: "YouTube concept",
    idea: "A YouTube channel about restoring old furniture.",
    type: ["content", "story"],
    adapter: "writing-prompt",
    contains: [/episode/i],
    bans: [/database/i],
  },

  /* ── Fashion — fit, fabric, placement ── */
  {
    name: "fashion collection",
    idea: "A streetwear collection inspired by community gardens.",
    type: "fashion",
    adapter: "fashion-prompt",
    engine: "design-shop",
    contains: [/silhouette/i, /mockup/i, /colourway|colorway|one/i],
    bans: [/database|route|deploy/i],
  },
  {
    name: "hoodie design",
    idea: "A hoodie design for my brother's fishing crew.",
    type: "fashion",
    adapter: "fashion-prompt",
    contains: [/placement/i, /sample/i],
    bans: [/database/i],
  },
  {
    name: "clothing line",
    idea: "A clothing line for tall women who can't find pants that fit.",
    type: "fashion",
    adapter: "fashion-prompt",
    contains: [/fit/i],
  },
  {
    name: "team jersey drop",
    idea: "A jersey design drop for our rec league.",
    type: "fashion",
    adapter: "fashion-prompt",
    contains: [/print/i],
  },

  /* ── Products and designs to sell ── */
  {
    name: "t-shirt for Etsy",
    idea: "A funny t-shirt to sell on Etsy for dog moms.",
    type: ["physical-product", "design"],
    adapter: "design-shop",
    engine: "design-shop",
    contains: [/mockup/i, /buyer/i],
  },
  {
    name: "printable",
    idea: "A printable weekly meal planner people can download.",
    type: "printable",
    adapter: "design-shop",
    contains: [/print-ready|300 DPI/i],
  },
  {
    name: "Etsy stickers",
    idea: "Stickers of my watercolor birds to sell on Etsy.",
    type: ["physical-product", "design", "printable"],
    adapter: "design-shop",
    contains: [/listing/i],
  },
  {
    name: "digital download",
    idea: "A digital download of budgeting templates for new college students.",
    type: "digital-product",
    adapter: "design-shop",
    contains: [/buyer|customer/i],
  },
  {
    name: "online course",
    idea: "An online course teaching teenagers how to bake bread.",
    type: "digital-product",
    adapter: "design-shop",
  },
  {
    name: "physical product",
    idea: "A wooden phone stand I make in my garage and want to sell.",
    type: "physical-product",
    adapter: "design-shop",
    contains: [/one finished unit|real buyer|honest reaction/i],
  },
  {
    name: "candle brand",
    idea: "Candles with scents named after Missouri summers.",
    type: ["physical-product", "design"],
    adapter: "design-shop",
  },
  {
    name: "greeting cards",
    idea: "Greeting cards with terrible puns for people who hate mushy cards.",
    type: ["physical-product", "design", "printable", "game"],
  },

  /* ── Services and businesses ── */
  {
    name: "dog-walking service",
    idea: "I want to start a dog-walking service in my neighborhood.",
    type: "service",
    adapter: "service-prompt",
    engine: "plan",
    contains: [/one real customer|first delivery/i, /boundar/i],
    bans: [/database|deploy/i],
  },
  {
    name: "tutoring service",
    idea: "Math tutoring for middle schoolers after school.",
    type: "service",
    adapter: "service-prompt",
    contains: [/deliver/i],
  },
  {
    name: "cleaning business",
    idea: "A cleaning service for offices, evenings and weekends.",
    type: "service",
    adapter: "service-prompt",
    contains: [/customer/i],
  },

  /* ── Real-world plans ── */
  {
    name: "birthday event",
    idea: "Plan my mom's 60th birthday party for about 40 people.",
    type: "event-plan",
    adapter: "plan",
    engine: "plan",
    contains: [/phases/i, /next action/i],
    bans: [/database|accounts/i],
  },
  {
    name: "fundraiser",
    idea: "A fundraiser car wash for the youth group this summer.",
    type: "event-plan",
    adapter: "plan",
  },
  {
    name: "family reunion",
    idea: "Organize our family reunion trip next June.",
    type: "event-plan",
    adapter: "plan",
  },
  {
    name: "tournament",
    idea: "A neighborhood cornhole tournament in September.",
    type: ["event-plan", "sports-plan"],
  },

  /* ── Early thoughts ── */
  {
    name: "vague idea",
    idea: "Something to help people somehow, not sure yet.",
    type: "unknown",
    adapter: "idea",
    engine: "idea",
    contains: [/naming it is the work|one sentence/i],
  },
  {
    name: "kind of an idea",
    idea: "Maybe some kind of thing for new parents?",
    type: "unknown",
    adapter: "idea",
    engine: "idea",
  },
  {
    name: "test before software",
    idea: "A subscription box of dog treats from local bakers.",
    type: "physical-product",
    contains: [/honest reaction|real buyer/i],
  },

  /* ── More coverage: variety and edge reads ── */
  {
    name: "recipe box",
    idea: "Grandma's recipes online for the family. I have photos of about 30 cards.",
    type: ["site", "list", "tool", "app"],
    contains: [/30/],
  },
  {
    name: "leaderboard",
    idea: "A leaderboard for family game night, add players, log who won.",
    type: ["list", "app", "tool", "game"],
  },
  {
    name: "habit tracker",
    idea: "A simple tracker for my reading habit, mark the days I read.",
    type: ["list", "tool", "app"],
  },
  {
    name: "poem for a card",
    idea: "A short poem for my wife's anniversary card.",
    type: "story",
    adapter: "writing-prompt",
    contains: [/aloud/i],
    bans: [/database|route/i],
  },
  {
    name: "kids chapter book",
    idea: "A chapter book for my 8-year-old about a detective hamster.",
    type: "story",
    adapter: "writing-prompt",
    bans: [/database/i],
  },
  {
    name: "church sermon",
    idea: "A sermon about patience for Sunday.",
    type: "story",
    adapter: "writing-prompt",
    contains: [/one message/i],
  },
  {
    name: "workout planner printable",
    idea: "A printable workout planner for busy dads.",
    type: "printable",
    adapter: "design-shop",
  },
  {
    name: "photography portfolio",
    idea: "A portfolio site for my photography, 22 scenery pictures from Colorado.",
    type: "site",
    contains: [/22/],
  },
  {
    name: "coffee shop game",
    idea: "A word game for the chalkboard at my coffee shop, one puzzle a day.",
    type: "game",
  },
  {
    name: "garden journal product",
    idea: "A garden journal people would buy at farmers markets.",
    type: ["physical-product", "design"],
    adapter: "design-shop",
  },
  {
    name: "song for a wedding",
    idea: "A first-dance song for my daughter's wedding.",
    type: "music",
    adapter: "music",
    bans: [/database|route/i],
  },
  {
    name: "football team site",
    idea: "A team website for our football schedule and photos.",
    type: "site",
    adapter: "build",
  },
  {
    name: "vacation planning",
    idea: "Plan a two-week road trip through the national parks with the kids.",
    type: "event-plan",
    adapter: "plan",
  },
  {
    name: "budget helper",
    idea: "Help me figure out a budget system my wife and I will actually stick to.",
    type: ["tool", "unknown", "list", "app"],
    contains: [/not financial advice/i],
  },
];

/* ── Exclusion + constraint preservation get their own fixtures ── */
const EXCLUSION_FIXTURE: Fixture = {
  name: "exclusions survive",
  idea: "A game where you sort recycling into bins before the truck comes.",
  exclusions: ["no accounts", "no leaderboards"],
  type: "game",
};

describe("quality fixtures — the product standard, executed", () => {
  const all = [...F, EXCLUSION_FIXTURE];

  it(`runs at least 75 fixtures`, () => {
    expect(all.length).toBeGreaterThanOrEqual(75);
  });

  for (const f of all) {
    it(`${f.name}`, () => {
      const record = newRecord(f.idea, { answers: f.answers, exclusions: f.exclusions });
      const v = viewOf(record);

      // 1. An appropriate creation type.
      const okTypes = Array.isArray(f.type) ? f.type : [f.type];
      expect(okTypes, `type was ${v.creationType}`).toContain(v.creationType);

      // 2. The right specialist.
      const adapter = adapterForType(v.creationType);
      if (f.adapter) expect(adapter.engineId).toBe(f.adapter);

      // 3. An honest engine recommendation — never an owner-only or planned door.
      const rec = recommendEngines(v);
      if (f.engine !== undefined) {
        if (f.engine === null) expect(rec.primary).toBeNull();
        else expect(rec.primary?.engineId).toBe(f.engine);
      }
      if (rec.primary) expect(["idea", "build", "sell", "launch", "fix", "grow", "plan", "design-shop", "music", "first-build"]).toContain(rec.primary.engineId);

      // 4. Core reads exist and are non-empty.
      expect(v.smallestOutcome.length).toBeGreaterThan(10);
      expect(v.versionOnePromise.length).toBeGreaterThan(10);

      const spec = adapter.spec(v);
      const specText = spec.map((s) => `${s.title}\n${s.lines.join("\n")}`).join("\n\n");
      const prompt = adapter.prompt(v, DEFAULT_BUILDER_DEFAULTS);

      // 5. Not an echo: the creator's words are kept, and the direction adds
      //    substantially more than they typed.
      expect(prompt).toContain(record.originalIdea);
      expect(prompt.length).toBeGreaterThan(f.idea.length * 3);

      // 6. Tools/setup/automation guidance is always present and honest.
      expect(specText).toContain("Tools and setup, honestly");
      expect(specText).toMatch(/Use: /);

      // 7. Version one stays small: every spec names something that waits.
      expect(`${specText}\n${prompt}`).toMatch(/wait|later|not (?:in|yet|until)|version two|deliberately|out of scope|don't need/i);

      // 8. Nothing broken leaks into user-facing text.
      expect(specText).not.toMatch(/undefined|\[object|NaN/);
      expect(prompt).not.toMatch(/undefined|\[object|NaN/);

      // 9. Expert content that must be present.
      for (const c of f.contains ?? []) {
        const re = typeof c === "string" ? new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : c;
        expect(`${specText}\n${prompt}`, `missing ${c}`).toMatch(re);
      }

      // 10. Wrong-world content that must be absent from the specialist spec.
      for (const b of f.bans ?? []) {
        const re = typeof b === "string" ? new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : b;
        expect(specText, `banned ${b} present`).not.toMatch(re);
      }

      // 11. Explicit exclusions are preserved, visibly.
      for (const x of f.exclusions ?? []) {
        expect(prompt.toLowerCase()).toContain(x.toLowerCase());
      }
    });
  }
});
