# Engine status — what actually works

**Latest pass: 2026-10-28/29 — honesty pass** (see "2026-10-28/29 honesty pass" at the end). Before that, **2026-10-23 — usefulness rescue.** Every public engine was run
in the real UI with a first-time visitor scenario (a weekly chore board as the
shared example) at 375px wide. The rule now: an engine ends with a usable
artifact — never a template, echoed answers, or a form for the visitor to fill
in — and says so plainly where it can't. See "2026-10-23 usefulness pass" below.

Originally verified by running each engine on **2026-07-15**. Not copied from a registry,
not inherited from an earlier note. If you change an engine, re-run it and
update this file.

These are **operational statuses** — they answer "does it work?". They are NOT
Open Mirror's public portfolio labels (Foundation / Free / Product / Project
Help / Exploring), which answer "what is this to a visitor?". Different
question, different vocabulary. Don't mix them.

| Status | Means |
| --- | --- |
| `working` | The complete stated flow was driven end to end and finished. |
| `beta` | Produces real output; less exercised, or part of the flow happens elsewhere. |
| `owner-only` | Works on the owner's machine. A visitor gets an error. |
| `building` | Real work started, flow does not complete yet. |
| `planned` | A concept. No route, no screen, nothing to open. |

## The engines (`app/engines/engines.ts`)

| Engine | Route | Status | Verified by |
| --- | --- | --- | --- |
| Idea Engine | `/engines?engine=idea` | working | Drove start → ideas → generated angles → scored 5 factors → decision record with handoff. |
| Design Shop Engine | `/engines?engine=design-shop` | working | Drove spark → 5 directions → score → design package → approve → **Export** (JSON / Markdown / Etsy draft downloads). Etsy *publishing* is honestly marked "not connected yet" in the UI. |
| Build Engine | `/engines?engine=build` | beta | Generates a real package (~8k chars, 6 specialty sections, 3.5k-char Claude Code prompt). |
| Sell Engine | `/engines?engine=sell` | beta | Generates a real package (~4.7k chars). |
| Launch Engine | `/engines?engine=launch` | beta | Generates a real package (~8k chars). |
| Fix Engine | `/engines?engine=fix` | beta | Generates a real package (~8k chars). |
| Grow Engine | `/engines?engine=grow` | beta | Generates a real package (~4k chars). |
| Plan Engine | `/engines?engine=plan` | beta | Generates a real package (~3.9k chars). |
| How to Anything Engine | `/engines` → 🎬 How to Anything Engine | beta | Drove the full flow in the browser on 2026-07-27 with the Xumo seed: capture → proof gate (verified it BLOCKS without the confirmation and blocks "uncertain") → package (script/shots/titles/description with chapters + disclosure) → footage checklist (6/6) → publish (video URL swaps into every social version) → performance check-in → reopen lands on Learn. 24 unit tests. Stays beta on purpose: filming and the YouTube upload happen off this page. |
| Music Engine | `/engines?engine=music` | beta | Two paths (2026-07-28): "Bring your song to life" — adaptive song workspace for creators arriving with words/melody/recordings (source preserved exactly, creator boundaries gate the UI, honest milestones, Version One requires real proof + explicit creator decision; see `docs/MUSIC-ENGINE.md`) — and the original first-beat beginner flow, unchanged. Stays beta on purpose: the audio comes out of the music software, which we cannot verify from here. |
| Game Engine | `/engines?engine=game` | **owner-only** | See below. |
| Etsy Engine | (hidden) | beta, **duplicate** | Folded into Design Shop. Hidden from the picker, kept defined so old saved Etsy projects still open. **Do not delete** — deleting it orphans saved projects. |

Story Engine and Fashion Engine exist only as `launched: false` entries in
`app/engines/shared/creation-engine.registry.ts`. No intake, no studio, no
route. They are listed in the Engine Room as **planned** text with no button —
we don't send anyone into an empty room.

## The Game Engine, precisely

The homepage used to say the Game Engine "pushes real games live to
OpenDoku.com". That is true for the owner and false for everyone else, so as
written it was false advertising to every visitor.

Tested both ways on 2026-07-15 with a valid world payload:

- **Local** (opendoku repo at `~/OpenDoku/opendoku`): `POST /api/engines/games/publish`
  with `action: "preview"` → **200**, returns real playable game HTML.
- **Production** (stepinthering.com): same payload → **501**
  `"No publish driver available here. Local driver needs the opendoku repo at
  /home/sbx_user1051/OpenDoku/opendoku"`.

The 501 hits **preview as well as publish** — the driver check in
`app/api/engines/games/publish/route.ts` runs before the preview branch. So on
production the Game Engine cannot even show you the game.

MineDoku on OpenDoku is real, and this engine really published it. That proves
the pipeline works; it does not prove a visitor can use it.

It becomes visitor-usable when the `github-api` driver (commit via the GitHub
contents API with `GITHUB_TOKEN`) lands. Until then it stays `owner-only`, says
so on its card and inside the studio, and the planner never recommends it.

## `/build` is not the Build Engine

Two different things that both say "build":

- **`/build`** — a six-round beginner walkthrough (Idea, Tools, Create, Save,
  Deploy, Domain) for someone who has never made a web app. No API, no login;
  progress in `localStorage` under `sitr-first-app-v1`. It is a **route, not an
  engine**, and it is not in the Engine Room grid.
- **Build Engine** (`/engines?engine=build`) — an engine that writes a detailed
  build brief for Claude Code. It writes the brief; it does not write the code.

Don't merge them. The planner hands beginners to `/build` (via the
`sitr-build-seed` key) and hands defined software work to the builder prompt.


## 2026-10-23 usefulness pass

The problem: visitors did the engine's work. Idea asked for 25 ratings and a
blank decision form; Build/Fix/Plan returned generic advice ("build the single
core action", "[name] by [date]", "engine or specialty not found").

The fix: Build, Fix, Plan, Sell, Launch and Grow now produce a finished
artifact from `app/engines/artifacts/` (deterministic — no AI). Questions were
cut to the ones that change the result; every optional one takes "I don't
know", which becomes a labeled, editable assumption. The result page leads with
the artifact: next action, sections, assumptions/unknowns, paste-ready prompt,
Copy / Download .md / Edit / Change answers. Edits save with the cycle; older
saved cycles rebuild their artifact from their answers. Filler phrases are
banned by `app/engines/artifacts/artifacts.test.ts`.

Scenario run in the browser for each (375px, no horizontal overflow on any):

| Engine | Scenario | What came out |
| --- | --- | --- |
| Build | "weekly chore board where parents assign chores, kids check them off, everyone sees what's done"; device = I don't know | Roles + stories, 4 screens, Chore/Person data, sample data, out-of-scope list, 6 "done when" checks, build prompt. Assumption labeled: one shared device. Edit → save → reload → reopen kept the edit. |
| Fix | "new chore disappears after refresh"; everything else I don't know | Classified as a persistence bug; 4 ranked causes with signs + fixes; two-minute DevTools check; reproduce steps; regression check; repair prompt. Unrecognised symptoms get an explicit "not a full answer yet". |
| Plan | "school fundraiser in six weeks with a $3,000 goal", me + two parent volunteers | 5 dated phases with owners and "done when", format options with the math (60 families × pledge), dependencies, dated checkpoints, risks, this week's 3 actions, shareable checklist. Title "School fundraiser". |
| Sell | printable chore charts, parents of 4–8 year olds, price I don't know | Offer, labeled price to test, sales copy, one-week test, message to send. |
| Launch | chore board web app with a link, worry "not tested on phones" | Pre-flight checklist (worry first), dated launch week, personal/social/email messages with the real link, result to count. |
| Grow | weekly signups; "visit but don't sign up"; 400 visitors / 6 signups | Experiment, baseline 6 of 400 (1.5%), win at 8 of 400, flat/worse rules, next three tests. |
| Idea | chore board sentence | Three distinct versions (paper test / smallest app / full), one recommended with the reason; picking one fills the whole decision (dated first action, how you'll know) and hands off. No scoring. Edits persist after reload. |
| Design Shop | "a printable weekly chore chart for kids" | Scoring step removed. Picking a direction builds the package: files, colors, fonts, words on the design (day columns), accessibility, Etsy draft with a real title, description ("What you get" filled), tags from the idea. No bracket placeholders. |
| Game (new idea) | "kids race to finish chores before the timer runs out", Party | The visitor's own idea is now asked for and used as the core action; challenge and replay hook filled as labeled suggestions; "play it today, no building" round. Visitors see the re-theme door marked owner-only. |
| Writing | short story, kid forgets her chores, dog covers | Pronoun-correct placeholder name (labeled), beginning/middle/end read from the premise, suggested ending labeled, opening line. Follow-up questions are optional. Survives reload. |
| Music | upbeat theme song, tool not sure | Tempo now follows the words (120 BPM for upbeat); "not sure" names a real browser tool instead of "your music app". |
| How to Anything | Google Sheets chore chart; teach a kid to ride a bike | Spreadsheets get five real steps. Anything without known steps shows a note that it is general guidance, not exact steps. |

### Not verified / remaining gaps

- **Story Partner** — owner-only; `/author` redirects to sign-in and no owner
  session was available, so it was not opened and was not changed.
- **Clipboard** — Copy buttons report "Copy failed" under scripted clicks
  (no user gesture); not re-tested by hand.
- **How to Anything** — only spreadsheets and the existing named domains have
  real steps; everything else is honest general guidance. The "Document it"
  production-package path was not re-run this pass.
- **Game** — the re-theme/publish path is still owner-only (see below).
- **Writing / Game** — shapes to build from, not finished pieces; they say so.

## 2026-10-28/29 honesty pass

Every public engine was driven in the browser (desktop and 375px) with real
example input. Rule for this pass: each engine is a simple guided tool. It
says what it does, never implies it reads or judges what you type, and never
claims something was built, checked, filmed or published.

- **Shared:** `useFlash` / `useTimedFlag` (`app/engines/shared/useFlash.ts`)
  replace copy-pasted timers in 13 components; a newer message can no longer
  be cleared by an older one's timer. Non-software results say "versions",
  not "build cycles".
- **Text readers (`artifacts/text.ts`, `product.ts`):** quantity, time and
  unit words are never the tracked thing; `asThing()` turns "I want to make
  cat stickers" into a noun phrase for Idea and Sell sentences.
- **Idea:** decision keeps the typed idea plus a separate "What to do";
  handoffs carry the idea, not the approach sentence. Sell no longer shows
  "Already have: …" for something that doesn't exist.
- **Sell / Launch / Plan / Grow:** no doubled price, link picked up from the
  idea, headcount read from the idea, metric trimmed to its first clause.
- **How To:** task session responds to a reported problem (or repeats a
  known step) and says it doesn't read notes; Document flow is "Confirm",
  not "Prove"; chapters other than 0:00 are `[m:ss]` blanks; no
  "Not sponsored." added; real accuracy checkbox + link check before
  "I published it".
- **Music:** "That didn't work" + Previous step; finished screen no longer
  says "exported". Song notebook is reachable again ("Open the song
  notebook"), starts at "Say what you already have", has undo, a Markdown
  export with the original words verbatim, and only the three guidance
  toggles that actually do something.
- **Design Shop:** Etsy draft's check-before-publishing list is unticked;
  physical listings don't promise PNG/SVG files; phrase tags within Etsy's
  20-char limit; seasonal direction uses the occasion.
- **Game:** saved idea survives reload; standard template lines are labelled;
  visitors see "Play it" disabled with the reason instead of a bare 401.

### Not verified in this pass
- Successful clipboard copy (the preview browser blocks it; only the
  graceful failure message was seen).
- Game owner path (preview + publish with an owner session).
- Etsy Listing Builder (only reached from an iDontCry Dream Shop handoff).
- How To capture-form validation and solution Delete.
