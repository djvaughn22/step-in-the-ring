// The creation profile — the second axis of classification.
//
// CreationType says WHAT KIND of thing this is (a story, music, software).
// The profile says WHICH FORM of that kind (a poem vs a screenplay, a song
// vs an album, one HTML file vs a web app, football vs lacrosse) — because
// the right first build is different for each, and handing a poet an app
// plan is the exact failure this system exists to prevent.
//
// Everything here is deterministic pattern reading, same as classify.ts.
// No creation-specific output is hard-coded; these are general form rules.

import type { CreationType, SoftwareCall } from "./types";

/* ── FORMS ─────────────────────────────────────────────────────────────── */

export type WritingForm =
  | "poem" | "short-story" | "novel" | "childrens-book" | "screenplay"
  | "blog" | "newsletter" | "speech" | "journal" | "piece";

export type MusicForm =
  | "song" | "lyrics" | "album" | "playlist" | "music-video"
  | "cover-art" | "performance" | "beat";

/** The smallest honest form of a software build. */
export type WebForm =
  | "html-file" | "landing-page" | "site" | "web-app" | "mobile-app"
  | "dashboard" | "api" | "spreadsheet";

export type SportKind = "football" | "lacrosse" | "basketball" | "baseball"
  | "soccer" | "hockey" | "volleyball" | "softball" | "wrestling" | "track"
  | "general";

export type SportsOutput =
  | "practice-plan" | "drill-library" | "playbook" | "team-site"
  | "stat-tracker" | "development-plan" | "tournament" | "schedule";

export interface CreationProfile {
  writingForm?: WritingForm;
  musicForm?: MusicForm;
  webForm?: WebForm;
  sport?: { kind: SportKind; output: SportsOutput };
  /** Fashion: what garment or line is being made. */
  garment?: string;
}

export const WRITING_FORM_LABEL: Record<WritingForm, string> = {
  poem: "a poem", "short-story": "a short story", novel: "a novel",
  "childrens-book": "a children's book", screenplay: "a screenplay",
  blog: "a blog", newsletter: "a newsletter", speech: "a speech",
  journal: "a journal", piece: "a written piece",
};

export const MUSIC_FORM_LABEL: Record<MusicForm, string> = {
  song: "a song", lyrics: "lyrics", album: "an album concept",
  playlist: "a playlist", "music-video": "a music video",
  "cover-art": "cover art", performance: "a performance plan", beat: "a beat",
};

export const WEB_FORM_LABEL: Record<WebForm, string> = {
  "html-file": "a one-file HTML prototype", "landing-page": "a landing page",
  site: "a website", "web-app": "a web app", "mobile-app": "a mobile app",
  dashboard: "a dashboard", api: "an API", spreadsheet: "a spreadsheet",
};

/* ── DETECTION ─────────────────────────────────────────────────────────── */

const SPORT_WORDS: [SportKind, RegExp][] = [
  ["football", /\bfootball\b/i],
  ["lacrosse", /\blacrosse\b|\blax\b/i],
  ["basketball", /\bbasketball\b/i],
  ["baseball", /\bbaseball\b/i],
  ["soccer", /\bsoccer\b/i],
  ["hockey", /\bhockey\b/i],
  ["volleyball", /\bvolleyball\b/i],
  ["softball", /\bsoftball\b/i],
  ["wrestling", /\bwrestling\b/i],
  ["track", /\btrack (?:team|meet|practice)\b/i],
];

export function findSportKind(text: string): SportKind | null {
  for (const [kind, re] of SPORT_WORDS) if (re.test(text)) return kind;
  if (/\b(coach|coaching|practice plan|drills?|playbook|scrimmage|varsity|jv\b)/i.test(text)) return "general";
  return null;
}

/** Coach-side sports work: plans, drills, playbooks — not a jersey design. */
export const SPORTS_PLAN_WORDS =
  /\b(practice (?:plan|schedule)|practices?\b.*\bplan|drill(?:s| library| plan| book)?|playbook|play ?sheet|scrimmage plan|training plan|conditioning|tryouts?|season (?:plan|schedule)|game plan|coaching plan|athlete development|player development|development plan|off-?season)\b/i;

function sportsOutput(text: string): SportsOutput {
  if (/\bplaybook|play ?sheet|plays\b/i.test(text)) return "playbook";
  if (/\bdrills?\b/i.test(text)) return "drill-library";
  if (/\b(stat|score|track(?:ing)? stats)\b/i.test(text)) return "stat-tracker";
  if (/\b(development|off-?season|get (?:better|faster|stronger))\b/i.test(text)) return "development-plan";
  if (/\btournament\b/i.test(text)) return "tournament";
  if (/\bschedule\b/i.test(text)) return "schedule";
  if (/\b(site|website|page)\b/i.test(text)) return "team-site";
  return "practice-plan";
}

function writingForm(text: string): WritingForm {
  if (/\bpoem|poetry|haiku|sonnet\b/i.test(text)) return "poem";
  if (/\bscreenplay|movie script|film script|tv (?:pilot|script)|teleplay\b/i.test(text)) return "screenplay";
  if (/\bchildren'?s book|picture book|bedtime (?:story|book)|kids'? book\b/i.test(text)) return "childrens-book";
  if (/\bnovel|book series|chapters?\b/i.test(text)) return "novel";
  if (/\bshort stor/i.test(text)) return "short-story";
  if (/\bblog\b/i.test(text)) return "blog";
  if (/\bnewsletter\b/i.test(text)) return "newsletter";
  if (/\bspeech|toast|eulogy|sermon\b/i.test(text)) return "speech";
  if (/\bjournal(?:ing)?\b/i.test(text)) return "journal";
  if (/\bstory\b/i.test(text)) return "short-story";
  return "piece";
}

function musicForm(text: string): MusicForm {
  if (/\balbum|\bep\b|record concept/i.test(text)) return "album";
  if (/\bmusic video\b/i.test(text)) return "music-video";
  if (/\bplaylist\b/i.test(text)) return "playlist";
  if (/\bcover art|album art\b/i.test(text)) return "cover-art";
  if (/\b(performance|setlist|set list|live show|concert|gig)\b/i.test(text)) return "performance";
  if (/\blyrics\b/i.test(text) && !/\b(song|track|beat)\b/i.test(text)) return "lyrics";
  if (/\bbeat\b/i.test(text) && !/\bsong\b/i.test(text)) return "beat";
  return "song";
}

function webForm(text: string, type: CreationType): WebForm {
  if (/\b(one|single)[- ]?(?:file|page)\s+(?:html|prototype|version)|html (?:file|page|prototype|mock-?up)|just (?:one page of )?html\b/i.test(text)) return "html-file";
  if (/\blanding page\b/i.test(text)) return "landing-page";
  if (/\bdashboard\b/i.test(text)) return "dashboard";
  if (/\bapi\b/i.test(text)) return "api";
  if (/\b(mobile|phone|ios|android) app\b/i.test(text)) return "mobile-app";
  if (/\bspreadsheet|excel|google sheet\b/i.test(text)) return "spreadsheet";
  if (type === "site") return "site";
  return "web-app";
}

const GARMENT =
  /\b(hoodies?|t-?shirts?|shirts?|hats?|caps?|jerseys?|jackets?|sweatshirts?|dress(?:es)?|clothing line|apparel|streetwear|outfits?|accessor(?:y|ies)|collection)\b/i;

/* Fashion is line-and-garment THINKING (fit, silhouette, a collection). A
   single graphic tee to sell on a marketplace is a designed product — that
   road already leads to the Design Shop, and it's the better road. */
const FASHION_STRONG =
  /\b(fashion|clothing (line|brand|collection)|apparel (line|brand)|streetwear|(collection|line) of (hoodies?|t-?shirts?|shirts?|hats?|clothes))\b/i;
const FASHION_GARMENT =
  /\b((hoodie|t-?shirt|shirt|hat|cap|jersey|jacket|sweatshirt|dress) (design|drop)|design .{0,30}(hoodie|t-?shirt|shirt|hat|jersey|jacket))\b/i;
const MARKETPLACE = /\b(etsy|sell(ing)?|to sell|listing|storefront|shop|store)\b/i;

/** Wearable-design thinking, as opposed to a marketplace product. */
export function looksFashion(text: string): boolean {
  return FASHION_STRONG.test(text) || (FASHION_GARMENT.test(text) && !MARKETPLACE.test(text));
}

/** Derive the profile for a classified creation. Cheap, pure, deterministic. */
export function deriveProfile(fullText: string, type: CreationType): CreationProfile {
  const p: CreationProfile = {};
  const sport = findSportKind(fullText);
  if (sport && (type === "sports-plan" || SPORTS_PLAN_WORDS.test(fullText) || /\bteam\b/i.test(fullText))) {
    p.sport = { kind: sport, output: type === "sports-plan" ? sportsOutput(fullText) : sportsOutput(fullText) };
  }
  if (type === "story") p.writingForm = writingForm(fullText);
  if (type === "content" && /\bblog|newsletter\b/i.test(fullText)) p.writingForm = writingForm(fullText);
  if (type === "music") p.musicForm = musicForm(fullText);
  if (type === "app" || type === "site" || type === "tool" || type === "list" || type === "game") {
    p.webForm = webForm(fullText, type);
  }
  if (type === "fashion") {
    const g = fullText.match(GARMENT);
    p.garment = g ? g[1].toLowerCase() : "garment";
  }
  return p;
}

/* ── TOOLS, SETUP, AUTOMATION ──────────────────────────────────────────────
   Every result states plainly: the simplest tools for version one, what the
   creator sets up by hand, what needs no setup at all, what turns automatic
   once connected, and what should wait. Never pretend anything is already
   configured; never demand paid infrastructure when a free path exists. */

export interface ToolsGuidance {
  /** The simplest recommended stack or creation tools, with the why. */
  stack: string;
  why: string;
  /** Manual, one-time setup the creator does themselves. */
  setup: string[];
  /** Works right now with zero setup. */
  noSetup: string[];
  /** Becomes automatic once the setup above is done. */
  automatic: string[];
  /** Optional — and what it would cost. */
  optional: string[];
  /** Deliberately later. */
  wait: string[];
}

export function deriveTools(
  type: CreationType,
  profile: CreationProfile,
  software: SoftwareCall,
): ToolsGuidance {
  const web = profile.webForm;

  if (type === "sports-plan") {
    return {
      stack: "One printable page, plus a phone-readable copy.",
      why: "A plan a coach can hold on the field beats any app. Nothing to install, nothing to charge.",
      setup: ["Write the plan once and print it (or keep it open on a phone)."],
      noSetup: ["Running the first practice from the printed page."],
      automatic: ["Reusing the template: after the first session, next week's plan is a 10-minute edit."],
      optional: ["A simple team page later, if parents need the schedule — free static hosting covers it."],
      wait: ["Apps, accounts, stat software — not until the plan itself has survived a few real practices."],
    };
  }

  if (type === "general-help") {
    // Confirmed live: the generic fallback below said "the idea needs one
    // more decision before tools matter" and "until the creation has a
    // definite form" — language written for a vague idea still taking
    // shape, wrong for a clear, already-formed question or situation.
    return {
      stack: "Nothing — the real bill, document, mechanic, or object, in front of the right person.",
      why: "This is a question or a real situation, not something to build. No tool makes it clearer than the real thing would.",
      setup: [],
      noSetup: ["Being specific about what you actually need answered."],
      automatic: [],
      optional: [],
      wait: ["Any tool at all, unless the answer itself calls for one."],
    };
  }

  if (type === "story" || type === "content") {
    const publishing = profile.writingForm === "blog" || profile.writingForm === "newsletter";
    return {
      stack: "Any plain writing tool you already have (a document, notes app, or paper).",
      why: "The work is the writing. No software choice will make the draft exist.",
      setup: publishing
        ? ["Pick where it publishes (a free blog host or a free newsletter service) — one account, once."]
        : ["Nothing. Open a blank page."],
      noSetup: ["Drafting, revising, and finishing the first piece."],
      automatic: publishing
        ? ["Once the publish home exists, each new piece is write → paste → send."]
        : ["Nothing needs automating — the routine is the tool."],
      optional: publishing
        ? ["A custom domain adds cost and can wait until readers exist."]
        : ["Formatting or print tools, only when a finished draft needs them."],
      wait: ["A website, an audience strategy, or any paid tool — the first finished draft comes first."],
    };
  }

  if (type === "music") {
    const mf = profile.musicForm ?? "song";
    if (mf === "playlist") {
      return {
        stack: "The music service you already use.",
        why: "A playlist is curation — the only tool is your ear.",
        setup: ["Nothing new."],
        noSetup: ["Building and ordering the list."],
        automatic: ["Sharing: one link once the list is public."],
        optional: [],
        wait: ["Cover art and a description, after the tracklist holds up for a week."],
      };
    }
    return {
      stack: "A free DAW (BandLab in the browser, or GarageBand if you have it).",
      why: "Free tools take a first demo the whole way. The demo proves the song, not the production.",
      setup: ["Create one free account in the DAW you pick."],
      noSetup: ["Writing lyrics, humming melodies, sketching structure on paper."],
      automatic: ["Exporting: once the project exists, every bounce is one click to an audio file."],
      optional: ["A microphone improves vocals but a phone recording proves the idea. Distribution services cost money — later."],
      wait: ["Mixing/mastering polish, releases, and any paid plugin until one finished demo exists."],
    };
  }

  if (type === "fashion") {
    return {
      stack: "Paper or a free design tool for the artwork, plus a print-on-demand mockup to see it real.",
      why: "One convincing mockup answers 'would anyone wear this?' before any money moves.",
      setup: ["Finalise the artwork file at print resolution.", "One free print-on-demand account to generate mockups (no order required)."],
      noSetup: ["Sketching directions, picking the garment, writing the exact text that appears on it."],
      automatic: ["Once artwork + product template exist, every new colourway or garment is minutes, not days."],
      optional: ["Ordering one physical sample costs the sample price and answers fit and fabric questions."],
      wait: ["Inventory, a storefront, and multi-item collections until one design gets an honest yes."],
    };
  }

  if (type === "printable" || type === "design" || type === "digital-product") {
    return {
      stack: "A free design tool (Canva free tier or any editor you know), exporting a print-ready file.",
      why: "The deliverable is a finished file. Product software would be building a factory for one cake.",
      setup: ["One free design-tool account, if you don't already have one."],
      noSetup: ["Deciding the exact text, size, and look on paper first."],
      automatic: ["Variants: once the first file is right, size and colour versions are minutes each."],
      optional: ["A marketplace listing (Etsy charges per listing and per sale) — only after the file is finished."],
      wait: ["Your own storefront, bundles, and automation until one file has sold or been used for real."],
    };
  }

  if (type === "physical-product") {
    return {
      stack: "The materials for ONE unit, and a phone camera.",
      why: "A physical product is proven by a real unit in a real hand, not by anything digital.",
      setup: ["Get just enough material to make one finished unit."],
      noSetup: ["Sketching it, pricing the materials, writing the one-line pitch."],
      automatic: ["Nothing yet — repetition earns automation."],
      optional: ["A simple listing photo setup (daylight and a plain wall are free)."],
      wait: ["Bulk materials, packaging design, and any storefront until unit one gets an honest reaction."],
    };
  }

  if (type === "service") {
    return {
      stack: "Your phone, a calendar, and one page (or post) that says what you do.",
      why: "A service is proven by delivering it. Software before customer one is procrastination with extra steps.",
      setup: ["Write the offer: what you do, for whom, for how much.", "Pick one channel where the first customer actually is (a neighbourhood group, a flyer, a text)."],
      noSetup: ["Delivering the service manually, start to finish."],
      automatic: ["Nothing yet — after five real deliveries the repetitive part will name itself."],
      optional: ["A one-page site later; free hosting is fine when it's time."],
      wait: ["Booking software, payment platforms, and branding until real customers exist."],
    };
  }

  if (type === "event-plan") {
    return {
      stack: "A shared checklist and a calendar.",
      why: "This is organisation. The plan is the product; tooling just holds it.",
      setup: ["One shared doc or note both organisers can edit."],
      noSetup: ["Phases, owners, dates — decided on paper."],
      automatic: ["Reminders: once dates are in a calendar, it nags so you don't have to."],
      optional: ["Free RSVP tools if the guest list is big."],
      wait: ["Event software and budgets for tooling — spend on the event, not the app."],
    };
  }

  if (type === "game" || type === "app" || type === "site" || type === "tool" || type === "list" || type === "unknown") {
    if (web === "html-file" || type === "game") {
      return {
        stack: "One file: HTML + CSS + JavaScript.",
        why: "One file proves the idea. It opens in any browser with no installs, no build step, no hosting.",
        setup: ["Nothing to start — save the file, double-click it, it runs."],
        noSetup: ["Building and playing/using it locally."],
        automatic: ["Sharing: connect the file to free static hosting once, and every save can go live."],
        optional: ["A custom domain has a small yearly registrar cost and changes nothing about how it works."],
        wait: ["Frameworks, databases, accounts, and app stores — a single file has to earn them first."],
      };
    }
    if (web === "spreadsheet") {
      return {
        stack: "A spreadsheet (Google Sheets is free).",
        why: "The job is rows, sums, and sharing — a spreadsheet already does all three.",
        setup: ["One sheet with the columns version one needs."],
        noSetup: ["Using and sharing it."],
        automatic: ["Totals and checks recalculate themselves once the formulas exist."],
        optional: [],
        wait: ["A custom app, until the sheet genuinely can't do the job."],
      };
    }
    if (web === "api") {
      return {
        stack: "The smallest possible service: a few endpoints on a free-tier host.",
        why: "An API exists for its consumers — define the first consumer before the first endpoint.",
        setup: ["A free hosting account and connecting the repository once."],
        noSetup: ["Designing the endpoints and example responses on paper."],
        automatic: ["Deploys: after the host is connected, every push ships."],
        optional: ["A database only when real data must outlive a restart — start with fixtures."],
        wait: ["Auth, rate limiting, and versioning until a real consumer calls it."],
      };
    }
    return {
      stack: "Plain HTML/CSS/JavaScript, or the simplest framework you already know — a few files, free hosting.",
      why: "Version one needs to exist, not scale. Free static hosting serves it to the world.",
      setup: ["A free hosting account (one time), connected to where the code lives."],
      noSetup: ["Building and testing it locally in a browser."],
      automatic: ["Deploys: once hosting is connected, every push goes live on its own."],
      optional: ["A custom domain (small yearly registrar cost). Analytics later, and only the free kind."],
      wait: ["Databases, accounts, logins, payments, dashboards, AI features — each needs a reason, and version one hasn't produced one yet."],
    };
  }

  // Fallback for anything unclassified.
  return {
    stack: "Paper first.",
    why: software.reason,
    setup: ["None yet — the idea needs one more decision before tools matter."],
    noSetup: ["Sharpening what this actually is."],
    automatic: [],
    optional: [],
    wait: ["All tooling until the creation has a definite form."],
  };
}

/** A real-world effort — a trip, a wedding, a fundraiser — not software.
 *  Shared so classify.ts's CreationType and interpret.ts's follow-up
 *  question can't quietly disagree about the same word list. */
export const EVENT_WORDS = /\b(event|party|wedding|reunion|fundraiser|trip|vacation|holiday|camp|tournament|campaign)\b/i;

/* ── GENERAL HELP — not "which form," but "is this a creation at all" ────
   Shared by both layers (interpret.ts's buildType and classify.ts's
   CreationType) for the same reason SPORTS_PLAN_WORDS/looksFashion already
   are: a comprehension request ("explain this bill"), a decision between
   named options, a learning request ("teach me X"), or a physical thing
   acting up — none of these are "make a thing" requests, and treating them
   like one produced real, confirmed nonsense: a broken toaster routed to
   the software Fix Engine ("copy it into your builder"), and "explain this
   bill" got told to "weigh a few versions and leave with one decision." */

const COMPREHENSION_WORDS = /\b(understand|explain|explains|explaining|explained|break(s|ing)? down|make sense of)\b/i;
const LEARNING_WORDS = /\b(teach me|learn (how|about|to)|how (does|do) .+ work)\b/i;
const DECISION_WORDS = /\b(help me (decide|choose)|which (one|option) (should|do)|choose between|weigh(ing)? (the|my|these) options)\b/i;
const PHYSICAL_OBJECT_WORDS = /\b(faucet|sink|toilet|drain|pipe|plumbing|toaster|fridge|refrigerator|dishwasher|washer|dryer|washing machine|oven|stove|furnace|water heater|air conditioner|\bac\b|heater|garage door|lawn ?mower|car|engine|tire)\b/i;
const MALFUNCTION_WORDS = /\b(leak(ing|s|ed)?|clogged|jammed|stuck|broken|broke|won'?t (start|turn on|open|close|drain)|stopped working|making a (weird |strange |loud )?noise)\b/i;
const DIGITAL_CONTEXT_WORDS = /\b(app|site|website|web ?page|button|login|log[- ]?in|account|database|code|software|server|api|script)\b/i;

/** A physical thing acting up, with no sign this is actually about software. */
export function looksLikeRealWorldTrouble(text: string): boolean {
  return PHYSICAL_OBJECT_WORDS.test(text) && MALFUNCTION_WORDS.test(text) && !DIGITAL_CONTEXT_WORDS.test(text);
}

/** A question, a decision, or a real situation — not a thing to build or weigh versions of. */
export function looksLikeGeneralHelp(text: string): boolean {
  return (
    COMPREHENSION_WORDS.test(text) ||
    LEARNING_WORDS.test(text) ||
    DECISION_WORDS.test(text) ||
    looksLikeRealWorldTrouble(text)
  );
}

/**
 * Which shade of general-help this is — same four signals above, just
 * named, so the ONE follow-up question asked can fit the actual need
 * instead of a single generic stand-in. Checked in the same order
 * `looksLikeGeneralHelp` implicitly does; "teach me how compound interest
 * works" hits LEARNING before it could ever hit COMPREHENSION's "explain".
 */
export type GeneralHelpKind = "learn" | "decide" | "understand" | "trouble";

export function generalHelpKind(text: string): GeneralHelpKind | null {
  if (LEARNING_WORDS.test(text)) return "learn";
  if (DECISION_WORDS.test(text)) return "decide";
  if (COMPREHENSION_WORDS.test(text)) return "understand";
  if (looksLikeRealWorldTrouble(text)) return "trouble";
  return null;
}
