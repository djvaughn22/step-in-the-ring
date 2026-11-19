// The finder, several drafts per browser, and the check before download
// (2026-11-18).
import { describe, expect, it } from "vitest";
import { checkDraft, isExampleAddress, isFictionPhone } from "./check";
import { DRAFT_KEY, draftFromExample } from "./draft";
import {
  DRAFTS_KEY, EMPTY_STORE, MAX_DRAFTS, activeEntry, addDraft, byRecent, draftLabel, isUntouched, loadStore, openExample,
  parseStore, removeDraft, saveStore, setActive, updateActive,
} from "./drafts";
import { EXAMPLES, exampleBySlug } from "./examples";
import { findExamples, scoreExample, stem } from "./finder";
import { starterFits } from "./fit";

function memoryStorage(seed: Record<string, string> = {}, limit = Infinity) {
  const m = new Map(Object.entries(seed));
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      const used = [...m.entries()].filter(([key]) => key !== k).reduce((n, [, val]) => n + val.length, 0);
      if (used + v.length > limit) throw new Error("QuotaExceededError");
      m.set(k, v);
    },
    removeItem: (k: string) => void m.delete(k),
  };
}

describe("the finder", () => {
  const first = (q: string) => findExamples(EXAMPLES, q)[0]?.slug;

  it("puts the closest example first for everyday words", () => {
    expect(first("dog grooming")).toBe("mobile-dog-groomer");
    expect(first("I walk dogs")).toBe("dog-walker-pet-sitter");
    expect(first("cakes")).toBe("home-bakery-small-caterer");
    expect(first("piano lessons")).toBe("music-teacher");
    expect(first("barber")).toBe("hair-stylist-barber");
    expect(first("plumber")).toBe("handyman");
    expect(first("tacos")).toBe("food-truck");
    expect(first("pottery")).toBe("handmade-maker");
    expect(first("logo design")).toBe("graphic-designer");
    expect(first("wedding dj")).toBe("event-dj");
    expect(first("our running club")).toBe("community-group");
    expect(first("family reunion")).toBe("family-reunion");
    expect(first("computer repair")).toBe("tech-help");
    expect(first("accountant")).toBe("bookkeeper");
    expect(first("Lawn Mowing!")).toBe("lawn-care-landscaping");
  });

  it("finds nothing rather than something random", () => {
    expect(findExamples(EXAMPLES, "zzqx")).toEqual([]);
    expect(findExamples(EXAMPLES, "my small business website")).toEqual(EXAMPLES);
  });

  it("filters by group, and keeps page order when nothing is typed", () => {
    const pets = findExamples(EXAMPLES, "", "Pets");
    expect(pets.map((e) => e.slug)).toEqual(EXAMPLES.filter((e) => e.group === "Pets").map((e) => e.slug));
    expect(findExamples(EXAMPLES, "cakes", "Pets")).toEqual([]);
  });

  it("stems plurals and -ing words", () => {
    expect(stem("cakes")).toBe("cake");
    expect(stem("cleaning")).toBe("clean");
    expect(stem("bakeries")).toBe("bakery");
    expect(stem("glass")).toBe("glass");
    expect(scoreExample(exampleBySlug("house-cleaner")!, "cleaning")).toBeGreaterThan(0);
  });
});

describe("several drafts per browser", () => {
  const groomer = draftFromExample(exampleBySlug("mobile-dog-groomer")!);

  it("moves the older single draft in, and never loses it", () => {
    const mine = { ...groomer, details: { ...groomer.details, name: "Suds on Wheels" } };
    const storage = memoryStorage({ [DRAFT_KEY]: JSON.stringify(mine) });
    const store = loadStore(storage, 1000);
    expect(store.drafts).toHaveLength(1);
    expect(activeEntry(store)?.draft.details.name).toBe("Suds on Wheels");
    expect(storage.getItem(DRAFT_KEY)).toBeNull();
    expect(parseStore(JSON.parse(storage.getItem(DRAFTS_KEY)!))?.drafts[0].draft.details.name).toBe("Suds on Wheels");
  });

  it("puts the old draft back if the new store can't be written", () => {
    const old = JSON.stringify(groomer);
    const storage = memoryStorage({ [DRAFT_KEY]: old }, old.length + 10);
    const store = loadStore(storage, 1000);
    // The new store is bigger than the room left, so the old key is restored.
    expect(storage.getItem(DRAFT_KEY)).toBe(old);
    expect(store.drafts).toHaveLength(1);
  });

  it("starts each new example as its own draft and reuses an untouched one", () => {
    let s = openExample(EMPTY_STORE, "handyman", 1)!;
    s = openExample(s, "photographer", 2)!;
    expect(s.drafts).toHaveLength(2);
    expect(activeEntry(s)?.draft.example).toBe("photographer");
    const again = openExample(s, "handyman", 3)!;
    expect(again.drafts).toHaveLength(2);
    expect(activeEntry(again)?.draft.example).toBe("handyman");
    // Once it's been changed, a second "Start from this" gives a fresh copy.
    const changed = updateActive(again, { ...activeEntry(again)!.draft, details: { ...activeEntry(again)!.draft.details, name: "Mine" } }, 4);
    expect(isUntouched(activeEntry(changed)!.draft)).toBe(false);
    expect(openExample(changed, "handyman", 5)!.drafts).toHaveLength(3);
  });

  it("stops at the limit instead of quietly dropping a draft", () => {
    let s = EMPTY_STORE;
    for (let i = 0; i < MAX_DRAFTS; i++) {
      s = addDraft(s, { ...groomer, details: { ...groomer.details, name: `Draft ${i}` } }, i, `id${i}`);
    }
    expect(openExample(s, "tutor", 99)).toBeNull();
  });

  it("switches, deletes and lists newest first", () => {
    let s = addDraft(EMPTY_STORE, groomer, 1, "a");
    s = addDraft(s, draftFromExample(exampleBySlug("tutor")!), 2, "b");
    expect(byRecent(s).map((e) => e.id)).toEqual(["b", "a"]);
    s = setActive(s, "a");
    expect(s.active).toBe("a");
    s = removeDraft(s, "a");
    expect(s.active).toBe("b");
    expect(removeDraft(s, "b")).toEqual({ v: 1, active: "", drafts: [] });
    expect(draftLabel({ ...groomer, details: { ...groomer.details, name: "  " } })).toBe("Mobile dog groomer");
  });

  it("ignores broken or foreign data instead of crashing", () => {
    expect(parseStore(null)).toBeNull();
    expect(parseStore({ v: 2, drafts: [] })).toBeNull();
    const s = parseStore({ v: 1, active: "nope", drafts: [{ id: "x", updated: 5, draft: groomer }, { id: "y", draft: { v: 9 } }, { id: "x", draft: groomer }] });
    expect(s?.drafts.map((e) => e.id)).toEqual(["x"]);
    expect(s?.active).toBe("x");
    expect(loadStore(memoryStorage({ [DRAFTS_KEY]: "{not json" }))).toEqual(EMPTY_STORE);
  });

  it("says when the browser is full", () => {
    const tiny = memoryStorage({}, 50);
    expect(saveStore(tiny, addDraft(EMPTY_STORE, groomer, 1, "a"))).toBe("full");
  });
});

describe("the check before download", () => {
  it("knows the made-up details apart from real ones", () => {
    expect(isFictionPhone("(555) 555-0142")).toBe(true);
    expect(isFictionPhone("(314) 555-2000")).toBe(false);
    expect(isExampleAddress("hello@example.com")).toBe(true);
    expect(isExampleAddress("https://example.com/book")).toBe(true);
    expect(isExampleAddress("jo@examples.test")).toBe(false);
  });

  it("flags every example's made-up name, phone and email before anyone publishes them", () => {
    for (const e of EXAMPLES) {
      const ids = checkDraft(draftFromExample(e)).items.filter((i) => i.level === "fix").map((i) => i.id);
      expect(ids, e.slug).toEqual(expect.arrayContaining(["name-example", "phone-example", "email-example", "no-contact"]));
      if (e.sample.booking) expect(ids, e.slug).toContain("booking-example");
    }
  });

  it("clears once the owner's own details are in", () => {
    const d = draftFromExample(exampleBySlug("event-dj")!);
    const mine = {
      ...d,
      details: { ...d.details, name: "Northside Nights", phone: "(314) 555-2000", email: "book@northside-nights.test", booking: "https://cal.northside-nights.test/book" },
      hero: { ...d.hero, headline: "DJ for weddings in the Northside" },
    };
    const r = checkDraft(mine);
    expect(r.fixCount).toBe(0);
    expect(r.good.join(" ")).toMatch(/phone, email, booking link/);
    expect(r.items.map((i) => i.id)).toEqual(expect.arrayContaining(["photos-empty", "add-yourself"]));
  });

  it("catches the old name left in the wording and a booking link that isn't one", () => {
    const d = draftFromExample(exampleBySlug("photographer")!);
    const r = checkDraft({ ...d, details: { ...d.details, name: "Fresh Frame", phone: "(314) 555-2000", booking: "my calendar" } });
    const ids = r.items.map((i) => i.id);
    if (JSON.stringify(d).split(d.details.name).length > 2) expect(ids).toContain("words-old-name");
    expect(ids).toContain("booking-bad");
  });
});

describe("Make it with AI points business sites at the starter", () => {
  it("offers the starter for a one-page site for a business, club or event", () => {
    expect(starterFits("a website for my dog grooming business")).toBe(true);
    expect(starterFits("A one-page site for our walking club")).toBe(true);
    expect(starterFits("website for the family reunion in July")).toBe(true);
  });
  it("leaves apps, games and member sites to the AI workspace", () => {
    expect(starterFits("a website where parents assign chores")).toBe(false);
    expect(starterFits("an app for my bakery")).toBe(false);
    expect(starterFits("a booking website for my salon with logins")).toBe(false);
    expect(starterFits("a game about dogs")).toBe(false);
  });
});
