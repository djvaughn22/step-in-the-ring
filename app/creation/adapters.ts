// Engine adapters — every active engine's own way of reading a creation,
// planning it, and writing its builder prompt.
//
// Shared primitives (section assembly, the doctrine block, fact/assumption
// framing) are reused; the CONTENT of each adapter is its own. An adapter
// that only changed headings while returning the same plan would be the
// exact disease this file exists to cure. A game spec talks about loops and
// win states; a design spec talks about dimensions and deliverables; a story
// spec never mentions a database.

import type { CreationView } from "./record";
import { doctrineLines, type BuilderDefaults } from "./builder-defaults";
import { WEB_FORM_LABEL } from "./profile";
import { CREATION_TYPE_LABEL, SOFTWARE_VERDICT_LABEL, type CreationType } from "./types";

export interface SpecSection {
  title: string;
  lines: string[];
}

export interface EngineAdapter {
  engineId: string;
  supports: CreationType[];
  /** The engine's own reading + plan. Materially engine-specific. */
  spec(v: CreationView): SpecSection[];
  /** A finished, copyable builder prompt for this engine's deliverable. */
  prompt(v: CreationView, d: BuilderDefaults): string;
}

/* ── Shared primitives ─────────────────────────────────────────────────── */

const lc = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const bullets = (items: string[]) => items.filter(Boolean).map((s) => `- ${s}`);

/**
 * Tools, setup, and automation — stated plainly on EVERY spec and prompt.
 * What to use, what the creator sets up by hand, what needs no setup, what
 * turns automatic once connected, and what deliberately waits. Nothing here
 * pretends a service is configured or invents access.
 */
function toolsSection(v: CreationView): SpecSection {
  const t = v.tools;
  return {
    title: "Tools and setup, honestly",
    lines: [
      `Use: ${t.stack} — ${lc(t.why)}`,
      ...(t.noSetup.length ? [`Works with no setup: ${t.noSetup.map(lc).join(" ")}`] : []),
      ...(t.setup.length ? ["Manual setup (one time):", ...bullets(t.setup)] : []),
      ...(t.automatic.length ? ["Automatic once that's done:", ...bullets(t.automatic)] : []),
      ...(t.optional.length ? ["Optional (know the cost before you say yes):", ...bullets(t.optional)] : []),
      ...(t.wait.length ? ["Deliberately later:", ...bullets(t.wait)] : []),
    ],
  };
}

/** The sections every prompt opens and closes with, whatever the engine. */
function promptShell(v: CreationView, d: BuilderDefaults, core: SpecSection[]): string {
  const i = v.interpretation;
  const sections: SpecSection[] = [
    {
      title: "Scope and permissions",
      lines:
        d.workMode === "existing-repo" || i.destination
          ? [
              `This work belongs to an existing project${i.destination ? ` (${i.destination.value})` : ""}. Inspect before editing; preserve unrelated work; protect existing routes and integrations.`,
            ]
          : ["Start clean. Nothing exists yet — do not assume access to any codebase or prior files."],
    },
    {
      title: "Original intent — the creator's exact words",
      lines: [
        `“${v.record.originalIdea}”`,
        "Serve this intent. Do not replace it with a nearby idea you like better.",
      ],
    },
    {
      title: "What is being made",
      lines: [
        `${CREATION_TYPE_LABEL[v.creationType]} — ${v.typeReason}.`,
        v.primaryUser ? `For: ${v.primaryUser}.` : "",
        v.beneficiary ? `Serving: ${v.beneficiary}.` : "",
        v.problem ? `The real need: ${v.problem}.` : "",
        `Smallest successful outcome: ${lc(v.smallestOutcome)}`,
        `Version-one promise: ${v.versionOnePromise}`,
      ].filter(Boolean),
    },
    ...core,
    ...(v.safetyConstraints.length
      ? [{ title: "Safety constraints (non-negotiable)", lines: bullets(v.safetyConstraints) }]
      : []),
    ...(v.record.exclusions.length || i.exclusions.length
      ? [
          {
            title: "Explicitly out of scope — do not build",
            lines: [
              ...bullets([...v.record.exclusions, ...i.exclusions.map((c) => c.value)]),
              "If one of these looks necessary, stop and say why instead of building it.",
            ],
          },
        ]
      : []),
    {
      title: "Assumptions made — correct them if wrong",
      lines: v.assumptions.length ? bullets(v.assumptions) : ["None recorded — everything above was stated."],
    },
    { title: "Working method", lines: bullets(doctrineLines(d)) },
  ];
  return sections
    .filter((s) => s.lines.length)
    .map((s) => `## ${s.title}\n${s.lines.join("\n")}`)
    .join("\n\n");
}

/* ── App / Build Engine ───────────────────────────────────────────────────
   An implementation-ready software brief: flows, states, data, acceptance. */

function appCore(v: CreationView): SpecSection[] {
  const i = v.interpretation;
  const behaviours = i.versionOne.map((c) => c.value);
  const web = v.profile.webForm;
  const formLine =
    web === "html-file"
      ? "Deliverable: ONE self-contained HTML file (HTML + CSS + JS inline). No framework, no build step — a single file that opens in a browser proves this idea."
      : web === "landing-page"
        ? "Deliverable: one landing page. One message, one primary action, nothing behind it yet."
        : web === "dashboard"
          ? "Deliverable: a dashboard — but name the data source first. A dashboard without real data is wallpaper."
          : web === "api"
            ? "Deliverable: the smallest API — define the first real consumer and only the endpoints that consumer calls."
            : web === "mobile-app"
              ? "Deliverable: build it as a mobile-first web app FIRST. It proves the idea on a phone today; app stores are a distribution decision for later, not a build requirement."
              : web === "spreadsheet"
                ? "Deliverable: a spreadsheet may be the whole product here — build the sheet before any app."
                : web
                  ? `Deliverable: ${WEB_FORM_LABEL[web]}.`
                  : "";
  return [
    {
      title: "Primary flow",
      lines: [
        formLine,
        "One route does the whole job of version one. Additional screens wait.",
        ...bullets(behaviours),
      ].filter(Boolean),
    },
    {
      title: "States that must exist",
      lines: bullets([
        "Empty state: the very first visit explains itself — no dead screen.",
        "Working state: the core action, obvious and reachable in one or two taps.",
        "Result state: the outcome is visible and unmistakable.",
        "Error state: anything that can fail says what happened in plain words.",
        "Loading is instant or visibly in progress — never a blank pause.",
      ]),
    },
    {
      title: "Data",
      lines: bullets([
        i.assets.length
          ? `Ships with real content the creator already has: ${i.assets.map((a) => a.value).join("; ")}.`
          : "Define the smallest data the flow needs; hard-code or bundle it — no database in version one.",
        "Anything worth keeping persists locally (versioned key, safe parse). No accounts.",
      ]),
    },
    {
      title: "Acceptance criteria",
      lines: bullets([
        ...behaviours.map((b) => `${b} — works on a narrow phone and a desktop.`),
        `The success test: ${lc(v.smallestOutcome)}`,
        "Keyboard-only completion of the core flow works, with visible focus.",
        "Nothing on the out-of-scope list exists.",
      ]),
    },
  ];
}

/* ── Game (specification through the Build path; the doku Game Engine
      publishes only from the owner's machine and keeps its own studio) ── */

function gameCore(v: CreationView): SpecSection[] {
  const f = v.record.facts;
  const i = v.interpretation;
  const stated = i.versionOne.filter((c) => c.confidence === "stated").map((c) => c.value);
  return [
    {
      title: "The game, precisely",
      lines: bullets([
        `Player: ${f.player || v.primaryUser || "whoever picks it up — assume no instructions get read"}.`,
        `Player goal: ${f.goal || i.desiredResult?.value || "state one goal the player can hold in their head from the first second"}.`,
        `Core action: the ONE input the player repeats${stated.length ? ` — from their words: ${stated.join("; ")}` : ""}.`,
        "Core loop: act → immediate feedback → new situation → act again. If this loop isn't fun bare, nothing added later fixes it.",
        f.theme ? `Theme: ${f.theme}.` : "Theme serves the loop, never replaces it.",
        "Rules: few enough to explain on the board itself — the board always tells the player what to do next.",
      ]),
    },
    {
      title: "Win, loss, and feedback",
      lines: bullets([
        "Win state: the game SAYS you won, clearly, and offers the next round.",
        "Loss/stuck state: the player always knows why, and retrying is one tap.",
        "Every action gets instant feedback — silence is a bug.",
        "A session fits the time the player actually has; one round is minutes, not hours.",
      ]),
    },
    {
      title: "Smallest playable proof",
      lines: bullets([
        "One level/round, fully playable start → win, before ANY menu, progression, or settings work.",
        "Play-test acceptance: someone who didn't build it finishes a round without being told how.",
        "Mobile-first: thumb targets, touch-action manipulation, nothing essential below the fold.",
        "Respect reduced motion; the game remains playable with animations minimised.",
      ]),
    },
    {
      title: "Do not add in version one",
      lines: bullets([
        "Accounts, currencies, stores, achievements, multiplayer, leaderboards, social systems.",
        "Menus beyond play/again. Progression only if a single round already proves fun.",
      ]),
    },
  ];
}

/* ── Design Shop ──────────────────────────────────────────────────────────
   The deliverable is a design package + listing draft — never a web app. */

function designCore(v: CreationView): SpecSection[] {
  const f = v.record.facts;
  const a = v.record.answers;
  return [
    {
      title: "The product",
      lines: bullets([
        `Product type: ${a.productType || f.productType || "decide from the idea — smallest producible format first"}.`,
        `Buyer / recipient: ${a.customer || f.audience || v.primaryUser || "one specific buyer — decide before designing"}.`,
        `Occasion or use: ${a.occasion || "everyday use unless the idea says otherwise"}.`,
        `The value: ${v.problem ? lc(v.problem) : "why someone picks THIS up — name it in one sentence"}.`,
        (a.spark || f.spark) ? `The spark: ${a.spark || f.spark}.` : "",
      ].filter(Boolean)),
    },
    {
      title: "Design requirements",
      lines: bullets([
        "Visual direction: one clear direction (colours, type feel, mood) stated before any artwork.",
        "Required text: every word that appears on the product, finalised and proofread.",
        "Dimensions & format: exact pixel/print dimensions for the product type, print-ready (300 DPI, bleed if physical).",
        "Personalisation: state what is fixed and what (if anything) the buyer customises.",
        "IP check: no celebrity names, brand marks, or copyrighted characters — original phrases only.",
      ]),
    },
    {
      title: "Deliverables",
      lines: bullets([
        "The finished design file(s) at production dimensions.",
        "One realistic mockup image showing it in use.",
        "Listing metadata draft: title, description, tags — written for the buyer, not the algorithm.",
        `First test: ${v.software.nonSoftwareTest ?? "one finished listing in front of one real buyer"}.`,
      ]),
    },
  ];
}

/* ── Sell ── */
function sellCore(v: CreationView): SpecSection[] {
  const a = v.record.answers;
  return [
    {
      title: "The offer",
      lines: bullets([
        `What they get: ${a.product || v.versionOnePromise}`,
        `Who pays: ${a.customer || v.primaryUser || "one specific buyer with the problem — name them first"}.`,
        `The problem it solves for them: ${a.problem || v.problem || "state it in their words, not yours"}.`,
        "Format and delivery: exactly what arrives, how, and when.",
        "Price hypothesis: one number with one sentence of reasoning — to be tested, not defended.",
      ]),
    },
    {
      title: "First validation",
      lines: bullets([
        `The smallest test: ${v.software.nonSoftwareTest ?? "put the offer in front of one real buyer and ask for a real yes/no"}.`,
        "A real yes means money or a firm commitment — kind words don't count.",
        "Decide in advance what result kills the idea and what result doubles down.",
      ]),
    },
  ];
}

/* ── Launch ── */
function launchCore(v: CreationView): SpecSection[] {
  const a = v.record.answers;
  return [
    {
      title: "Readiness, honestly",
      lines: bullets([
        `What's launching: ${a.what || v.versionOnePromise}`,
        `First audience: ${a.audience || v.primaryUser || "the real people who see it first"}.`,
        a.worried ? `The stated weak spot — attack this first: ${a.worried}.` : "List the three most likely embarrassments and fix only those.",
        "Only launch-blocking fixes. Polish that doesn't stop a launch waits.",
      ]),
    },
    {
      title: "The launch itself",
      lines: bullets([
        "Production checks: the live URL loads, on a phone, logged out, from a clean browser.",
        `One measurable first result: ${a.measure || "pick one number and a date"}.`,
        "The message: one honest sentence about what it is and who it's for — no hype.",
        "A feedback path: one easy way for a real user to tell you what broke.",
      ]),
    },
  ];
}

/* ── Fix ── */
function fixCore(v: CreationView): SpecSection[] {
  const a = v.record.answers;
  const i = v.interpretation;
  return [
    {
      title: "Inspect before editing",
      lines: bullets([
        `The symptom: ${a.symptom || v.record.originalIdea}`,
        a.when ? `When it started / what changed: ${a.when}.` : "Find when it last worked — git history before guesswork.",
        "Reproduce it first. A fix for an unreproduced bug is a guess.",
        `Protected: ${a.protect || (i.preserve.length ? i.preserve.join("; ") : "everything that works today")}.`,
      ]),
    },
    {
      title: "The repair",
      lines: bullets([
        "Smallest safe correction — no refactors riding along.",
        `Fixed means: ${a.win || i.desiredResult?.value || "the exact broken journey works again, verified by doing it"}.`,
        "Add a regression check around the repaired path.",
      ]),
    },
  ];
}

/* ── Grow ── */
function growCore(v: CreationView): SpecSection[] {
  const a = v.record.answers;
  return [
    {
      title: "One experiment",
      lines: bullets([
        `The number to move: ${a.measure || "pick ONE number that matters this cycle"}.`,
        `Where people stall: ${a.bottleneck || v.problem || "find the drop-off before hypothesising"}.`,
        `Evidence so far: ${a.evidence || "honest guesses count, but label them as guesses"}.`,
        `Hypothesis: ${a.guess || "one sentence — 'if we change X, the number moves because Y'"}.`,
        "The smallest experiment that can prove it, a measurement, and a decision rule with a date.",
        "No second experiment until the first returns evidence.",
      ]),
    },
  ];
}

/* ── Plan ── */
function planCore(v: CreationView): SpecSection[] {
  const a = v.record.answers;
  return [
    {
      title: "The real-world plan",
      lines: bullets([
        `Outcome: ${a.outcome || v.versionOnePromise}`,
        `Who it serves and who's involved: ${a.people || v.primaryUser || "name the people, even if it's just you"}.`,
        `In the way right now: ${a.problem || v.problem || "the honest blocker this plan has to beat"}.`,
        a.deadline ? `Deadline: ${a.deadline}.` : "Set one date, even a soft one.",
        "2–4 phases, each with an owner and a checkpoint that ends it.",
        "The immediate next action — small enough to do today.",
      ]),
    },
    {
      title: "Not software",
      lines: [
        "Nothing to build here — if tooling tempts you, a shared checklist is the ceiling for version one.",
      ],
    },
  ];
}

/* ── Music — outputs appropriate to music, never software architecture ── */
function musicCore(v: CreationView): SpecSection[] {
  const f = v.record.facts;
  const form = v.profile.musicForm ?? "song";
  const listener = `Listener / moment: ${v.primaryUser || "who it's for, or the moment it soundtracks — name one before writing"}.`;
  const source = f.mode === "music" && f.brief ? `From their brief: ${f.brief}.` : "";

  if (form === "album") {
    return [
      {
        title: "The album concept",
        lines: bullets([
          listener, source,
          "The thread: the one feeling or story that makes these songs an ALBUM and not a pile.",
          "Track arc: 6–10 titles in order — opener, the emotional middle, the closer. Titles can change; the arc shouldn't.",
          "One sentence per track: what it's about and how it serves the thread.",
        ]),
      },
      {
        title: "First deliverable",
        lines: bullets([
          "Not ten songs — ONE: fully write and demo the single track the whole album leans on.",
          "The concept one-pager: thread, track arc, and the demo attached.",
        ]),
      },
    ];
  }
  if (form === "lyrics") {
    return [
      {
        title: "The lyric",
        lines: bullets([
          listener, source,
          "The one line the song exists to say — write it first; every verse earns its place by serving it.",
          "Structure: verse–chorus–verse–chorus–bridge is the default; break it on purpose or not at all.",
          "Rhyme and rhythm: read it out loud — lines that trip the tongue get rewritten.",
        ]),
      },
      {
        title: "First deliverable",
        lines: bullets([
          "One complete lyric sheet, spoken aloud start to finish without stumbling.",
          "Original words only — no borrowed lines.",
        ]),
      },
    ];
  }
  if (form === "music-video") {
    return [
      {
        title: "The video",
        lines: bullets([
          listener, source,
          "The song decides the video: mood, tempo, and the one image someone remembers after watching.",
          "Shot plan: 5–10 shots on paper (location, action, when in the song). Phone camera is enough.",
          "One location and one day of shooting for version one.",
        ]),
      },
      {
        title: "First deliverable",
        lines: bullets([
          "A one-page shot list and the first 30 seconds cut to the actual track.",
          "Only footage and music you have rights to.",
        ]),
      },
    ];
  }
  if (form === "playlist") {
    return [
      {
        title: "The playlist",
        lines: bullets([
          listener, source,
          "The job: what moment does it hold? (a run, a dinner, a mood repair). The job picks the songs.",
          "Order matters: openers set the promise, the middle keeps it, the last track decides how it's remembered.",
          "12–20 tracks for version one — long enough to hold, short enough to curate honestly.",
        ]),
      },
      { title: "First deliverable", lines: bullets(["The list, ordered, with a title and two-line description — shared with one person who fits the moment."]) },
    ];
  }
  if (form === "cover-art") {
    return [
      {
        title: "The cover",
        lines: bullets([
          listener, source,
          "The music decides the art: name the sound's feeling in three words and design to those.",
          "It must read at thumbnail size — most people will only ever see it 60 pixels wide.",
          "Exact deliverable: 3000×3000px, original artwork only.",
        ]),
      },
      { title: "First deliverable", lines: bullets(["One finished cover at full size, checked at thumbnail size, shown next to the artists it would sit beside."]) },
    ];
  }
  if (form === "performance") {
    return [
      {
        title: "The performance",
        lines: bullets([
          listener, source,
          "The room: where, how long, and for how many — a 15-minute open mic and an hour set are different products.",
          "Setlist arc: open strong, place the quiet moment on purpose, end with the one they leave humming.",
          "Rehearse transitions, not just songs — the gaps are where sets die.",
        ]),
      },
      { title: "First deliverable", lines: bullets(["A written setlist with timings, and one full run-through performed for one honest listener."]) },
    ];
  }
  // song / beat
  return [
    {
      title: `The ${form === "beat" ? "beat" : "song"}`,
      lines: bullets([
        listener, source,
        "Genre, mood, and a tempo range — pick before touching an instrument.",
        "Structure: the simplest complete form (e.g. intro–verse–chorus–verse–chorus–out).",
        "The hook: one repeatable musical or lyrical idea the piece is built around.",
      ]),
    },
    {
      title: "First deliverable",
      lines: bullets([
        "One exported audio file, start to end — rough is fine, finished is the point.",
        "Free tools only; the demo proves the song, not the production.",
        "Original work only — no borrowed melodies or lyrics.",
      ]),
    },
  ];
}

/* ── Writing (no engine yet — the prompt path serves each FORM honestly).
      A poem never receives an app plan; a screenplay gets scenes, not screens. */
function writingCore(v: CreationView): SpecSection[] {
  const form = v.profile.writingForm ?? "piece";
  const reader = `Reader: ${v.primaryUser || "who reads it — one real person is enough to write for"}.`;
  const noApp = "This is a manuscript job: nothing to install, nothing to build, nothing to sign up for.";

  if (form === "poem") {
    return [
      {
        title: "The poem",
        lines: bullets([
          reader,
          "The core image or moment — one concrete thing the poem circles. Abstractions borrow power from it, not the other way round.",
          "Form: free verse unless a form (haiku, sonnet, rhyming couplets) serves the subject — pick on purpose.",
          "The turn: where the poem shifts — every poem that lands has one.",
          "Read it aloud; the line breaks are where the breath goes.",
        ]),
      },
      {
        title: "First deliverable",
        lines: bullets(["One finished poem, read aloud twice, left overnight, revised once.", noApp]),
      },
    ];
  }
  if (form === "screenplay") {
    return [
      {
        title: "The screenplay",
        lines: bullets([
          reader,
          "Logline first: protagonist + want + obstacle in one sentence. If the logline is soft, pages won't save it.",
          "Protagonist: what they want, why they can't have it, what it costs to try.",
          "The conflict engine: who or what pushes back in every single scene.",
          "Structure: three acts — setup and break-in, escalating middle, crisis to climax. Beat sheet before pages.",
          "Tone: name the two films it sits between, then write scenes, not descriptions of scenes.",
        ]),
      },
      {
        title: "First writing milestone",
        lines: bullets([
          "The logline, a one-page beat sheet, and the FIRST SCENE in proper screenplay format.",
          "Standard format matters (a free tool like a screenplay template covers it) — readers stop at wrong margins.",
          noApp,
        ]),
      },
    ];
  }
  if (form === "novel") {
    return [
      {
        title: "The novel",
        lines: bullets([
          reader,
          "Premise in one sentence: a character with a want runs into what's in the way — at novel scale, the want must be big enough to carry 200+ pages.",
          "Central conflict: the thing that cannot be resolved in chapter two.",
          "Characters: protagonist and the two or three people who make their problem worse.",
          "World: only what the story needs — worldbuilding that never reaches the page is procrastination.",
          "Structure: a 10–20 line chapter map, beginning to end, before drafting past chapter three.",
        ]),
      },
      {
        title: "Smallest writing proof",
        lines: bullets([
          "Chapter one, finished — plus the chapter map. A first chapter someone asks to read more of is the green light.",
          "A sustainable pace beats a heroic weekend: schedule the writing, not the inspiration.",
          noApp,
        ]),
      },
    ];
  }
  if (form === "childrens-book") {
    return [
      {
        title: "The children's book",
        lines: bullets([
          `Two readers at once: the child hearing it and the adult reading it aloud${v.primaryUser ? ` — for ${lc(v.primaryUser)}` : ""}. It must serve both.`,
          "Premise: one character with one want and one obstacle, said in one sentence — a raccoon can carry a whole book if the want is real.",
          "Age band decides everything: word count, sentence length, how dark the wolf gets.",
          "Read-aloud rhythm: it will be performed, not read — write for the voice.",
          "Page turns are the pacing: a picture book is ~32 pages / 12–15 spreads; the turn is the punchline.",
          "One simple emotional truth underneath — kids smell a lecture instantly.",
        ]),
      },
      {
        title: "First deliverable",
        lines: bullets([
          "The full text, split by spread, read aloud to one real child.",
          "Illustration notes per spread (stick figures count) — the words don't need to describe what the picture shows.",
          noApp,
        ]),
      },
    ];
  }
  if (form === "blog" || form === "newsletter") {
    return [
      {
        title: form === "blog" ? "The blog" : "The newsletter",
        lines: bullets([
          reader,
          "The promise: what does a reader reliably get from every piece? Name it in one line — it's the masthead.",
          "The first three pieces, titled — three proves it's a publication and not one lucky post.",
          "A sustainable cadence you can actually keep (weekly beats daily-then-dead).",
          form === "newsletter"
            ? "Delivery: a free newsletter service handles subscribers; the writing is still the hard part."
            : "Home: a free blog host is fine — the writing matters, the platform doesn't yet.",
        ]),
      },
      {
        title: "First deliverable",
        lines: bullets(["Piece one, published, sent or shown to one real reader.", noApp]),
      },
    ];
  }
  if (form === "speech") {
    return [
      {
        title: "The speech",
        lines: bullets([
          `Audience and occasion: ${v.primaryUser ? lc(v.primaryUser) : "who's in the room, and why they're gathered"}.`,
          "One message — a speech that says two things says nothing. Write the sentence they should repeat the next day.",
          "Open with the moment, not the throat-clearing; close by landing the one message.",
          "Write for the ear: short sentences, real words, pauses marked.",
        ]),
      },
      {
        title: "First deliverable",
        lines: bullets(["A full draft delivered out loud, timed, to one honest listener.", noApp]),
      },
    ];
  }
  if (form === "journal") {
    return [
      {
        title: "The journal practice",
        lines: bullets([
          "This one is for you — no audience, which means no performance.",
          "The trigger: attach it to something that already happens daily (coffee, lights-out).",
          "A prompt beats a blank page: pick three questions worth answering on a bad day.",
          "Small enough to survive: three sentences counts.",
        ]),
      },
      {
        title: "First deliverable",
        lines: bullets(["Seven consecutive days of entries, any length. The streak is the product.", noApp]),
      },
    ];
  }
  // Episodic content (a podcast, a channel, a video series) is a publication
  // with a voice, not a story with a plot — and never an app.
  if (form === "piece" && /\b(podcast|episode|youtube|video series|channel|series)\b/i.test(v.record.originalIdea)) {
    return [
      {
        title: "The series",
        lines: bullets([
          reader.replace("Reader:", "Audience:"),
          "The promise: what a listener or viewer reliably gets from every episode — one line, and it's the show.",
          "The first three episodes, titled — three proves it's a series and not one good idea.",
          "Episode shape: length, segments, and how every episode opens and closes. Consistency is what people subscribe to.",
          "A cadence you can actually keep — fortnightly and alive beats daily and abandoned.",
          "Recording: the phone or laptop you already own is enough for episode one.",
        ]),
      },
      {
        title: "First deliverable",
        lines: bullets([
          "Episode one, recorded and finished, played for one honest listener before anything is published.",
          noApp,
        ]),
      },
    ];
  }
  // short story / general piece
  return [
    {
      title: "The story",
      lines: bullets([
        reader,
        "Premise in one sentence: a character with a want runs into what's in the way.",
        "Central character: what they want, what it costs, what flaw trips them.",
        "Structure: setup → turn → ending. Three beats before any prose.",
        "Emotional promise: name the feeling the reader should close it with.",
      ]),
    },
    {
      title: "First deliverable",
      lines: bullets([
        "One finished draft at the chosen length — finished beats good in draft one.",
        "One revision pass with fresh eyes before anyone else reads it.",
        noApp,
      ]),
    },
  ];
}

/* ── Fashion — audience, silhouette, materials, placement; never an app ── */
function fashionCore(v: CreationView): SpecSection[] {
  const garment = v.profile.garment ?? "garment";
  return [
    {
      title: "The design",
      lines: bullets([
        `Who wears it: ${v.primaryUser || "one specific person — picture them putting it on, and where they're going"}.`,
        `The use: everyday wear, an event, a team, a statement? The use picks the ${garment} and the fabric weight.`,
        "Silhouette and fit: fitted, relaxed, oversized — decide, and say it in the listing so nobody guesses.",
        "Artwork placement: exactly where it sits (front centre, left chest, back, sleeve) and at what printed size in inches.",
        "Every word that appears on it, finalised and proofread — typos are permanent in fabric.",
        "Original artwork only: no brand marks, no borrowed characters, no celebrity references.",
      ]),
    },
    {
      title: "Production reality",
      lines: bullets([
        "Artwork at print resolution (300 DPI at printed size, transparent background).",
        "Sizing range for version one: the standard S–XL of the blank you print on — no custom sizing yet.",
        "Print-on-demand for the first run: no inventory, cost per unit is higher but risk is zero.",
        "Colourways: ONE for version one. The second colour comes after the first sells or gets worn.",
      ]),
    },
    {
      title: "First sample",
      lines: bullets([
        "One realistic mockup (free from the print-on-demand template) shown to someone who'd actually wear it.",
        "Then one physical sample ordered before anything goes on sale — screens lie about fabric and placement.",
        `The honest test: ${v.software.nonSoftwareTest ?? "one real person says they'd wear it — and means it"}`,
      ]),
    },
  ];
}

/* ── Sports — a coach's plan: structure, cues, progression, safety.
      Football thinks like a football coach; lacrosse like a lacrosse coach. ── */
function sportsCore(v: CreationView): SpecSection[] {
  const sport = v.profile.sport?.kind ?? "general";
  const output = v.profile.sport?.output ?? "practice-plan";
  const sportName = sport === "general" ? "the sport" : sport;

  const cues: Record<string, string> = {
    football: "Coaching cues in football language: stance, first step, pad level, eyes. One cue per rep — players can't fix three things at once.",
    lacrosse: "Coaching cues in lacrosse language: cradle tight, stick protection, feet on ground balls, head up on the move. One cue per rep.",
    basketball: "Coaching cues: footwork before form, eyes up, follow through. One cue per rep.",
    soccer: "Coaching cues: first touch, body shape, head up before receiving. One cue per rep.",
    general: "Coaching cues: one specific, sayable correction per drill — players can't fix three things at once.",
  };
  const cueLine = cues[sport] ?? cues.general;

  if (output === "playbook") {
    return [
      {
        title: "The playbook",
        lines: bullets([
          `Team and level: ${v.primaryUser || "name the age/level — a youth playbook and a varsity playbook are different products"}.`,
          "Base first: 4–6 core plays the team can run in their sleep beat 30 plays nobody remembers.",
          "Each play on one page: name, formation, every player's assignment, and the ONE read that makes it work.",
          "Name plays so players remember them under pressure — call words beat numbering systems at youth level.",
          "Counters: for each base play, the one counter that punishes the defence for stopping it.",
        ]),
      },
      {
        title: "First usable version",
        lines: bullets([
          "The 4–6 base plays, drawn and named, printed on cards a coach can hold on the sideline.",
          "Installed one per practice — a play isn't 'in' until players run it right without the card.",
        ]),
      },
    ];
  }
  if (output === "drill-library") {
    return [
      {
        title: "The drill library",
        lines: bullets([
          `Who runs it: ${v.primaryUser || `a ${sportName} coach mid-practice — it must be scannable in five seconds`}.`,
          "Each drill on one card: name, players needed, equipment, setup diagram, the skill it builds, time.",
          cueLine,
          "Progression: every drill lists its easier and harder version, so one library serves the whole roster.",
          "Organised by skill, not alphabet — a coach shops by 'we need ground ball work', not by G.",
        ]),
      },
      {
        title: "First usable version",
        lines: bullets([
          "Ten drills, printed or phone-readable, covering the three skills the team most lacks.",
          "Field-tested: run each drill once in a real practice before it earns its card.",
        ]),
      },
    ];
  }
  if (output === "development-plan") {
    return [
      {
        title: "The development plan",
        lines: bullets([
          `The athlete: ${v.primaryUser || "one player — age, position, and the honest current level"}.`,
          "Two or three measurable targets for the season — not ten. Skills compound when focus doesn't split.",
          "The weekly rhythm: which days, how long, what gets touched every session vs rotated.",
          cueLine,
          "Progression by earned steps: the next level unlocks when the current one is clean, not when the calendar says so.",
        ]),
      },
      {
        title: "First usable version",
        lines: bullets([
          "Week one written out day by day, plus the season targets on one page the athlete can see.",
          "Reviewed after the first week: keep what got done, cut what got skipped twice.",
        ]),
      },
    ];
  }
  // practice-plan (default) — also covers schedule/tournament shapes honestly.
  return [
    {
      title: "The practice plan",
      lines: bullets([
        `Team and level: ${v.primaryUser || `name the age/level — a ${sportName} practice for 9-year-olds and one for varsity share nothing but the ball`}.`,
        "Total time, blocked out: warm-up → skill blocks → team period → conditioning → close. Every block has minutes.",
        "Equipment list up front — a drill that needs cones you don't have is a gap in the plan, on the field.",
        cueLine,
        "Max players moving, minimum standing: lines of six waiting kill practices. Split stations before adding minutes.",
        "Progression across weeks: each practice sharpens ONE thing from last time. Name it at the top of the page.",
      ]),
    },
    {
      title: "First usable session",
      lines: bullets([
        "One complete practice on one printable page (phone-readable too) — blocks, minutes, drills, cues.",
        "Run it once for real. Keep what worked, cut what dragged, and next week's plan is a 10-minute edit.",
        `The honest test: ${v.software.nonSoftwareTest ?? "one real practice runs on this plan, start to finish"}`,
      ]),
    },
  ];
}

/* ── Service ── */
function serviceCore(v: CreationView): SpecSection[] {
  return [
    {
      title: "The service",
      lines: bullets([
        `Customer: ${v.primaryUser || "one specific person who'd pay"}.`,
        `The promise: ${v.versionOnePromise}`,
        "Trigger → delivery steps → done: write the exact sequence of one delivery.",
        "Boundaries: what's included, what isn't, and what you'll refuse.",
        "Proof: what the customer holds at the end that shows it worked.",
      ]),
    },
    {
      title: "First delivery",
      lines: bullets([
        `${v.software.nonSoftwareTest ?? "Deliver it manually to one real customer before building anything."}`,
        "Repeatability check: could you do it again tomorrow without heroics?",
      ]),
    },
  ];
}

/* ── Idea Engine (interpretation + decision, not a build) ── */
function ideaCore(v: CreationView): SpecSection[] {
  const i = v.interpretation;
  return [
    {
      title: "Interpretation to challenge",
      lines: bullets([
        `Strongest current reading: ${i.summary}`,
        `The real problem or desire: ${v.problem ?? "not yet named — naming it is the work"}.`,
        `Meaningful gap: what do people do today instead, and why isn't that enough?`,
        `Distinctive angle: what makes this one worth existing?`,
        `Software necessity: ${SOFTWARE_VERDICT_LABEL[v.software.verdict]} — ${lc(v.software.reason)}`,
      ]),
    },
    {
      title: "The decision to produce",
      lines: bullets([
        "One chosen version of the idea, in one sentence.",
        `The simplest real test: ${v.software.nonSoftwareTest ?? "the smallest version a real person can react to this week"}.`,
        "Honest reasons to pursue or pause — both lists, written down.",
        "The next engine (or the builder prompt) it hands into.",
      ]),
    },
  ];
}

/* ── The registry ──────────────────────────────────────────────────────── */

function makeAdapter(
  engineId: string,
  supports: CreationType[],
  core: (v: CreationView) => SpecSection[],
): EngineAdapter {
  // Every adapter closes with honest tools/setup/automation guidance — the
  // creator always leaves knowing what to use and what to skip.
  const withTools = (v: CreationView) => [...core(v), toolsSection(v)];
  return {
    engineId,
    supports,
    spec: withTools,
    prompt: (v, d) => promptShell(v, d, withTools(v)),
  };
}

const ADAPTERS: EngineAdapter[] = [
  makeAdapter("idea", ["unknown", "app", "site", "tool", "list", "game", "content", "story"], ideaCore),
  makeAdapter("build", ["app", "site", "tool", "list"], appCore),
  makeAdapter("sell", ["physical-product", "digital-product", "design", "printable", "service"], sellCore),
  makeAdapter("launch", ["app", "site", "tool", "game"], launchCore),
  makeAdapter("fix", ["app", "site", "tool", "list", "game"], fixCore),
  makeAdapter("grow", ["app", "site", "content"], growCore),
  makeAdapter("plan", ["event-plan", "service"], planCore),
  makeAdapter("design-shop", ["design", "printable", "digital-product", "physical-product"], designCore),
  makeAdapter("music", ["music"], musicCore),
  // The doku Game Engine keeps its own studio; this adapter is how a game
  // CREATION gets specified and prompted (via the Build path or a handoff).
  makeAdapter("game", ["game"], gameCore),
];

const BY_ID = new Map(ADAPTERS.map((a) => [a.engineId, a]));

export function adapterFor(engineId: string): EngineAdapter | undefined {
  return BY_ID.get(engineId);
}

/** The adapter whose lane best fits the creation itself. */
export function adapterForType(type: CreationType): EngineAdapter {
  switch (type) {
    case "game": return BY_ID.get("game")!;
    case "design":
    case "printable":
    case "digital-product":
    case "physical-product": return BY_ID.get("design-shop")!;
    case "fashion": return makeAdapter("fashion-prompt", ["fashion"], fashionCore);
    case "music": return BY_ID.get("music")!;
    case "story":
    case "content": return makeAdapter("writing-prompt", ["story", "content"], writingCore);
    case "service": return makeAdapter("service-prompt", ["service"], serviceCore);
    case "sports-plan": return makeAdapter("sports-prompt", ["sports-plan"], sportsCore);
    case "event-plan": return BY_ID.get("plan")!;
    case "unknown": return BY_ID.get("idea")!;
    default: return BY_ID.get("build")!;
  }
}

/** Engine-fit check: can this engine serve this creation, and if not, which fits? */
export function engineFit(engineId: string, v: CreationView): { fits: boolean; better?: string; note?: string } {
  const a = BY_ID.get(engineId);
  if (!a) return { fits: true };
  // The Build Engine IS the visitor path for games (the doku Game Engine is
  // owner-only) — a game here is in the right place and gets the game spec.
  if (engineId === "build" && v.creationType === "game") return { fits: true };
  if (a.supports.includes(v.creationType) || v.creationType === "unknown") return { fits: true };
  const better = adapterForType(v.creationType);
  return {
    fits: false,
    better: better.engineId,
    note: `This can still be built here, but it reads as ${lc(CREATION_TYPE_LABEL[v.creationType])} — the ${better.engineId.endsWith("-prompt") ? "builder prompt path" : `${better.engineId} lane`} fits its real shape better.`,
  };
}
