# Engine status — what actually works

Verified by running each engine on **2026-07-15**. Not copied from a registry,
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
| Music Engine | `/engines?engine=music` | beta | Device picker, official tool links and step tracking load and save. Stays beta on purpose: the beat is exported from BandLab, which we cannot verify from here. |
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
