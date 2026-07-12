@AGENTS.md

# StepInTheRing (stepinthering.com)
Idea-to-first-build coach, secular. Accent: **#60A5FA**.
- **The Seven Questions (the intake philosophy, every engine):** a founder's mind top to bottom — 1 Dream (what is it?) · 2 Person (who's it for?) · 3 Pain (what's broken for them?) · 4 Win (what does better look like the first time it works?) · 5 Ground/Scope · 6 Core · 7 Limit. Same arc in every engine and every lane; only the wording changes. Seven on purpose — DJ's number, complete. Canonical: `QUESTIONS` in app/page.tsx; Engine Room variants in `app/engines/engines.ts` (keys are stable — generator.ts/specialties.ts read them; add keys, never rename).
- **The road to live (every engine):** build → **test locally** (Verify tab) → return with results → the push button unlocks → "Send to Open Mirror to push it live" (mailto with test results). Every push lands on **/live** (`app/live/live-products.json` — one entry per product; the Game Engine's publish route appends and pushes automatically; everything else is a one-line edit by DJ).
- **Brand = the Ring (boxing, flat):** the mark is a flat top-down boxing ring (`.ring-mark`, gold corner posts, rope insets — never a glowing portal). Vocabulary used sparingly and plainly: step in, rounds, fight plan, your corner. One primary CTA per screen; other paths are explained doors, not competing buttons. Homepage order: hero (one CTA) → three rounds → tag-in examples → doors (/build, /engines) → Built Through the Ring proof (live OpenDoku links) → In Your Corner tools.
- Accepts `?idea=` handoff from iDontCry's Dream Lab (prefills the build form) and links back.
- Kids build with a parent — keep that note.

## Open Mirror family rules
- One of 11 Open Mirror LLC sites (hub: openmirrorllc.com, repo djvaughn22/open-mirror). Baseline tag: `mvp-1`.
- **Design:** flat + cool. bg `#0b1220`, surface `#141d2e`, border `#26324c`, text `#e8edf5`, muted `#94a3b8`. No glass, no gradients, **no red**.
- **Shared chrome is SYNCED, not owned here:** `OpenMirrorNav.tsx`, `OpenMirrorFooter.tsx`, `OpenMirrorTheme.tsx` in the app folder are copies from the hub repo `packages/openmirror-ui/`. NEVER edit them here — edit in the hub, run its `scripts/sync-ui.sh`, then rebuild/commit each satellite.
- Nav + footer mount in `layout.tsx`. Footer = OPEN MIRROR LLC · ABOUT · ✝️ ❤️ 🙏 (the icons ARE the CrossHeartPray link — no word).
- ☀️/🌙 family toggle (`om-theme`) lives in the bar; pages that compute JS colors follow the `om-theme` window event.
- **Copy style:** DJ's words. Short, plain, human. Never wordy or AI-sounding.
- **Deploys:** push to `main` = production deploy (Vercel). Batch related edits into one commit.

## Etsy Engine

**Route:** `/engines` → select "Etsy Engine"

**Purpose:** Help users vet rough product ideas and generate execution packages for Etsy listing + social launch.

**Intake questions:**
- Product idea (textarea)
- Source brand (choice: CrossHeartPray, TheDJCares, DontCloneMeTom, iDontCry, StepInTheRing, Open Mirror, Other)
- Product type (choice: Printable, Sticker, Shirt, Mug, Card, Journal, Digital Download, Bundle, Surprise Me)
- Intended buyer (text)
- Tone (choice: Funny, Inspiring, Thoughtful, Playful, Bold, Gentle, Mixed)
- Format preference (choice: Digital, Print-on-Demand, Handmade, Undecided)
- Phrase or visual concept (text)
- Major concern or risk (textarea, optional)

**Output specialties:**
- Product decision & recommendation (Build First / Refine / Park / Avoid)
- Etsy listing draft (title, short desc, long desc, 13 tags, price hypothesis)
- Organic social launch pack (Instagram hooks, Reel concepts, Story ideas, hashtags)
- Fulfillment path notes
- Legal & trademark risk flags

**Generator:** `app/engines/generator.ts` handles all engines uniformly. Etsy logic is in `nonTechPrompt()`, `objective()`, `direction()`, `scope()` functions.

**No APIs:** Deterministic output from curated templates. Works offline.

**Next work:** Link from iDontCry Dream Shop handoff → Etsy Engine prefill (not yet wired). Document the shared handoff format.

## Game Engine

**Route:** `/engines?engine=game` (deep link used by iDontCry's Game Lab) or Engine Room picker → 🎮 Game Engine.

**The pipeline (reference pattern for all future platform modes):**
iDontCry Game Lab → Game Engine here → real prod push to the platform repo → Vercel deploys the new game live.

- `app/engines/games/game-modes.ts` — mode registry (OpenDoku live, iDontCry arcade planned), `DokuWorld` schema, template instantiation (pure logic, shared by UI + API).
- `app/engines/games/GameStudio.tsx` — studio UI: platform → template → world form (prefilled MineDoku) → launchpad with playable iframe preview → publish.
- `app/engines/games/privileges.ts` — publish privileges. BUILD PHASE: everyone past the access gate can publish. Later: map access codes → roles and enforce in the API route too.
- `app/api/engines/games/publish/route.ts` — preview + publish. Driver today: **local-git** (opendoku repo at `~/OpenDoku/opendoku` or `OPENDOKU_REPO_PATH`): writes `<slug>/` + homepage card, commits, pushes main. A github-api driver (GITHUB_TOKEN) comes later so production stepinthering.com can publish; until then the route 501s off this machine.

**Templates live in the platform repo** (`opendoku/_templates/sum-mine.html`), theme-driven via `__DOKU_THEME__` + `__DOKU_HEAD__` marker blocks; the homepage card lands above `__DOKU_CARDS_END__` in opendoku's index.html. MineDoku (⛏️ Sum-Mine's home world) was the first engine-published game.

**Game doctrine (every game + template, non-negotiable):** mobile-first always (thumb targets, `touch-action:manipulation`, nothing essential below the fold on a phone); the board always tells the player what to do next — goal line on every deal, live guidance when stuck, win→next flow scrolled into view (silence is a bug); one easy rule then a named climb, progressively harder but never impossible; records/high scores on every mode. Full doctrine comment sits on `GameTemplate` in `game-modes.ts`.
