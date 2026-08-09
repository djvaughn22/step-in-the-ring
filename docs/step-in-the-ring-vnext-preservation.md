# Step In The Ring vNext — Preservation Map

**Baseline tag:** `pre-vnext-2026-08-08` (commit `facf4ca`). Roll back to it with
`git checkout pre-vnext-2026-08-08` — nothing below was deleted, so a rollback is
about the shell, not about recovering work.

**The rule this document exists to enforce:** we started the UX fresh, not the
product. Every surface, route, storage key and test listed here still works. The
new experience sits *over* what already existed.

Guarded by `app/vnext/vnext.test.ts` — the routes table, the storage keys and the
shell rules are all asserted there. Adding a surface? Add its row here AND its key
to `LEGACY_SOURCES` in `app/vnext/legacy.ts`.

---

## The vNext shell (new in this session)

| Piece | Lives in | What it is |
| --- | --- | --- |
| Creation entry | `app/vnext/CreationEntry.tsx` | The one question — "What do you want to create?" Presentational; owns no storage, no interpretation. Mounted by the homepage and by Your Builds. |
| The Build | `app/vnext/build.ts` | `BuildRecordV1` — id, title, intent (the person's own words), stage, goal, audience, constraints, currentAction, capabilitiesUsed, artifacts, history. Safe parse, forward-compatible via `extra`. |
| Capability registry | `app/vnext/capabilities.ts` | Metadata catalog over the existing engines + surfaces. Derived from `app/engines/engines.ts` — no capability logic is duplicated. `capabilitiesForIntent()` is deterministic substring matching, never a model call, and only ever returns something a visitor can actually open. |
| Compatibility bridge | `app/vnext/legacy.ts` + `LegacyWork.tsx` | Read-only discovery of pre-vNext work in the visitor's browser. Test-locked against ever writing, clearing or migrating. |
| Your Builds | `app/builds/` | The authenticated centre of gravity. Server-persistent. |
| Build detail | `app/builds/[id]/` | One Build: "Right now" first (stage, threshold line, the next move), then what can help, what came out, and the full history. |
| Transitions | `app/vnext/actions.ts` | Every change is a pure function of `(build, action, now)`. Unknown actions are refused, not ignored. |
| Transition seam | `app/api/builds/[id]/route.ts` | POST an *action*, never a record. The server loads the Build, applies the transition, writes it back. Ownership/session/access rules are the member project store's, unchanged. |
| Your Work | `app/library/` | Every capability, one level down from the question. |

**Build persistence is server-backed today.** A Build saves through the EXISTING
account-linked project store (`app/members/projects.ts` → `ProjectRecord`) under the
reserved engine id `vnext-build`, with `BuildRecordV1` serialized into the project's
`content` JSON. There is deliberately no second storage stack. The reserved engine
row in `app/engines/engines.ts` is `hidden: true` — **deleting it orphans every saved
Build.**

---

## Old surfaces

`PRESERVED` = route, behavior and data untouched by vNext.

| Old surface | Route | Capability | Persistence | vNext destination | Status | Migration? | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| The planner | `/` | Reads a rough idea → what it is, version one, tools, builder prompt | `sitr-plans-v3`, `sitr-creation-current-v1`, `sitr-builder-defaults-v1` (local) | Still the homepage; hero rewritten, flow unchanged | PRESERVED (hero copy + shared entry component) | No | `planner/interpret.test.ts`, `storage.test.ts`, `creation/quality.test.ts` |
| Engine Room | `/engines` | 13 engines, honest activation labels | `sitr-engine-projects-v1`, `creation-engine-projects-v1` (local) | Door on the homepage + every engine listed in `/library` | PRESERVED | No | `engines.test.ts`, per-engine tests |
| Project OS | `/projects`, `/project` | Lifecycle, evidence ladder, owner gates | `sitr-projects-v1` (local) | Listed in `/library` (owner-only), surfaced by Your Work | PRESERVED | No | `project/project.test.ts` |
| Account + member projects | `/account`, `/api/members/projects/*` | Server-saved projects, export, delete | Postgres (Neon) via `members/store.ts` | Unchanged; Builds ride the same store | PRESERVED | No | `membership.test.ts`, `session-verify.test.ts` |
| Membership / signup / login | `/membership`, `/members/signup`, `/members/login` | Beta door, sessions, entitlements | Postgres | Unchanged | PRESERVED | No | `beta-access.test.ts`, `login-notification.test.ts`, `middleware.test.ts` |
| Owner surfaces | `/owner`, `/owner/members`, `/owner/tester-codes`, `/owner/feedback` | Owner admin | Postgres | Unchanged | PRESERVED | No | `membership.test.ts` |
| Story Partner | `/author` | Author's Room, local-first | IndexedDB `sitr-story-partner` v2 + local mirror | Listed in `/library` (owner-only); bridge notes its presence | PRESERVED | No | `capture.engine.test.ts`, `capture.preservation.test.ts`, 4 story test files |
| Game Engine | `/engines?engine=game` | Publishes games to OpenDoku | `sitr-game-world-v1` (local) | Listed in `/library` (owner-only, labelled) | PRESERVED | No | game engine tests |
| Music Engine | `/engines?engine=music` | Song projects | `sitr-music-songs-v1` (local) | `/library`; suggested from Build intent | PRESERVED | No | music engine tests |
| Design Shop / Etsy | `/engines?engine=design-shop`, `?engine=etsy` | Design + listing packages | Engine project store | `/library` (Etsy stays listed — hidden ≠ unreachable) | PRESERVED | No | `etsy-package.test.ts` |
| How to Anything | `/engines?engine=howto` | Faceless how-to production packages | Engine project store | `/library` | PRESERVED | No | `howto.engine.test.ts` |
| Build Machine | `/build-machine` | Old computer → build machine | `sitr-build-machine-v1` (local) | `/library`, Your Work bridge | PRESERVED | No | — |
| First build walkthrough | `/build` | Beginner path to something running | `sitr-first-app-v1` (local) | `/library`, homepage footer link | PRESERVED | No | — |
| Five Hour Sprint | `/five-hour-sprint-tool`, `/products/five-hour-sprint` | One focused block to a finished piece | local | `/library` | PRESERVED | No | — |
| Live builds | `/live` | Everything pushed live | `live-products.json` | `/library` + homepage proof section | PRESERVED | No | — |
| How it works | `/how` | The explanation | — | Homepage link + `/library` | PRESERVED | No | — |
| Shop | `/shop` | Things you can buy | — | `/library` | PRESERVED | No | `publicPriceGuard.test.ts` |
| About | `/about` | Open Mirror business page | — | Nav (kept, does not compete with creation) | PRESERVED | No | — |
| Nav + footer | `layout.tsx` | Synced Open Mirror chrome | — | Same components, simplified `links` prop only | PRESERVED | No | `footer.test.ts`, `vnext.test.ts` |

### What actually changed

1. **Hero copy** — `Step In The Ring` / **Live your dream.** / "Turn what's in your head
   into something real." The "open beta" pill moved out of the hero into the honest
   note lower down; the beta warning itself is unchanged in substance.
2. **Homepage order** — hero → creation entry → quiet links → examples → live proof →
   "What's under it" (Engine Room door + Your Work door + beta honesty). The
   "what people finish here" engine grid moved into `/library`.
3. **Primary nav** — Create · Your Builds · Your Work · Account · About. Engine Room,
   Build Machine, Live Builds and How It Works moved one level down (homepage
   sections + `/library`). No route was removed.
4. **`/builds` and `/library` are public routes in middleware** — deliberate. Both
   surface work that lives in the *visitor's own browser*; a session gate would lock
   people out of their own files. Server-saved Builds still require a verified member
   session, checked in the page's own server component.

### Session 2 — what changed again

1. **STEP IN now lands on the Build, not on a plan document.** The homepage's
   `clarify` stage is gone: the one question it asked is asked *inline* on the
   step-in moment instead, where answering it visibly sharpens the card above.
   Nothing else about the planner moved. The full plan, the builder prompt, the
   brief and record downloads, `Make it a project` and the engine handoff are all
   still there, one tap behind **See the whole plan** → the unchanged `result`
   stage.
2. **`app/vnext/shape.ts`** — the bridge from the existing deterministic reading
   (`planner/interpret` → `creation/record`'s `CreationView`) to the Build. No
   model call, ever. Same words in, same shaping out.
3. **`GET`/`POST /api/builds`** — creating a Build takes only the person's own
   words; the title, reading, version one and first move are derived server-side.
   `BuildsClient` no longer posts to the generic projects API.
4. **`BuildRecordV1` gained `reading` and `versionOne`**, both optional. Every
   Session 1 Build parses and renders exactly as before.
5. **`reshape` action** — "Read my words again" catches an older Build up. Strictly
   additive, idempotent, and it will not replace anything a person wrote.
6. **`app/vnext/draft.ts`** — an idea in flight rides sessionStorage through the
   sign-in round trip. Never described as saved work.

---

## Verified, and what wasn't

Verified in the browser at 375px and desktop, both themes, against the production
build and then against production itself: the hero, the creation entry (hero +
question + Step in all land in the first phone screenful), the five-door nav, the
legacy bridge finding real saved work, the planner flow end to end, `/library`
filtering, every pre-vNext route resolving, no console errors, no horizontal scroll.
On production: `POST /api/builds/[id]` refuses an anonymous write with 401 and
`/builds/[id]` sends a logged-out visitor to sign in.

**Not verified: the signed-in half.** There is no local database, and signing in as
the owner is not something an agent should do. The Builds list, creating a Build,
the detail page, and the transition seam are unit-tested and typechecked but have
never been exercised against a real account.

Session 2 closed as much of that gap as is closable without an account: both
`/builds` and `/builds/[id]` are now **rendered** in tests through every state a
person can land in (no builds, one, several, a database hiccup, no live access,
signed out mid-idea, a store that is not switched on, an older Build with no
reading, and read-only access), and the Build API is exercised end to end through
**real sessions** rather than mocked auth. What is still unproven is the round trip
against a real Postgres.

**DJ: sign in on a phone, step in from the homepage, press "Keep this build",
open it, move a stage, add a note.** That is the one gate left on this work.

## Next milestones

- **Capability adapters** — a Build reaching a capability currently links out. The
  use is recorded before the browser leaves, but the Build's intent does not travel
  with it. Carrying it *into* the engine intake is the next real integration, and
  the point where `capabilitiesUsed` starts earning its place.
- **Artifacts that arrive on their own** — an engine finishing something should be
  able to attach it to the Build that asked for it.
- **Normalizing legacy objects into Builds** — deliberately not attempted. The bridge
  displays; it does not convert. A rushed migration that loses a saved plan is worse
  than a slightly ugly bridge.
- **Rename or delete a Build** from the UI (the member API already supports both).
