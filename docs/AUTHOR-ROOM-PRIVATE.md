# The Author's Room — private Story Partner

The password-protected, local-first author's room at `/author`. It wraps the
Story Partner engine (`app/engines/story/`) with real server-side
authentication, IndexedDB persistence, project-level revisions, dual backups,
and optional vault encryption. This document is the owner's reference:
architecture, setup, honest limits, and disaster recovery.

Nothing in this repository contains the owner's real memories, real names,
manuscript text, or the real password. Tests and examples use invented data
only. The `.gitignore` blocks `PRIVATE-*` files and local backup folders.

---

## 1. Authentication

- **Where:** `app/author/auth.ts`, `app/api/author/login/route.ts`,
  `app/api/author/logout/route.ts`, checked server-side in
  `app/author/page.tsx` before any private UI renders.
- **Shared boundary:** the same session now protects every private SITR
  surface (`/engines`, `/projects`, the `/owner` hub, and the game publish
  API) — see `OWNER-AUTH.md`. One login opens all of them; one logout (or a
  password rotation) closes all of them.
- **Password:** the `STORY_OWNER_PASSWORD` environment variable (min 4
  characters; shorter is treated as unconfigured). Verified on the server
  with a timing-safe comparison. It is never in the client bundle, never in
  localStorage, never in a URL, never logged, never echoed in a response.
- **Fail-closed:** with no password configured, the login replies
  "The room isn't configured yet" and nobody gets in.
- **Session:** stateless signed token `expiry.hmac` in an HTTP-only cookie
  (`sitr-author-session`): Secure in production, SameSite=Strict, 30-day
  expiry, explicit logout. The signing secret is derived from the password,
  so **rotating the password invalidates every session**. Set
  `STORY_SESSION_SECRET` to rotate sessions independently.
- **Repeated attempts:** per-address in-memory throttle — 5 failures in 10
  minutes locks that address for 60 seconds; every failure gets a flat 400 ms
  delay and the same generic message. Honest limit: serverless instances each
  hold their own counter and reset on cold start, so this slows an attacker
  rather than stopping one. The strong password is the real defense.
- **This gate is not "unhackable."** It stops unauthenticated visitors and
  crawlers. It does not protect against someone at the owner's unlocked
  computer, a malicious extension in this browser profile, or anyone with
  access to the Vercel project settings.

### Owner setup (one time)

1. In Vercel → Project → Settings → Environment Variables, add
   `STORY_OWNER_PASSWORD` (Production; a long passphrase you don't use
   anywhere else). Optionally add `STORY_SESSION_SECRET` (any long random
   string).
2. Redeploy (or push any commit).
3. Visit `stepinthering.com/author`, enter the password.
4. To change the password: edit the env var, redeploy. All sessions end.
5. Locally: put `STORY_OWNER_PASSWORD=...` in `.env.local` (gitignored).

## 2. Route privacy

- `/author` and `/api/author/*` send `Cache-Control: no-store, private` and
  `X-Robots-Tag: noindex, nofollow` (see `next.config.ts`), plus meta
  robots noindex. `app/robots.ts` disallows `/author` and `/api/` — a
  courtesy to crawlers, not authentication.
- The page is `force-dynamic`: nothing private is statically generated or
  CDN-cached. Unauthorized visitors receive only the login shell — no titles,
  no counts, no project data. There is no sitemap; the public Engine Room
  card for Story Partner reveals nothing and links only to the login.
- The manuscript itself never reaches the server at all (see below), so
  server logs and analytics have nothing to leak. There is no analytics or
  error-reporting service wired into the room's routes.

## 3. Where the writing lives (local-first)

- **IndexedDB** (database `sitr-story-partner`, version 2) is the durable
  store: object stores `projects`, `vaults` (structurally separate),
  `revisions`, `meta`, and `audio` (original recordings, stored as raw
  bytes and rebuilt into Blobs on load — v2 added this store additively;
  nothing from v1 is touched). See `app/engines/story/db.ts`.
- **localStorage** remains a best-effort mirror of projects and unencrypted
  vaults, and is the migration source for pre-IndexedDB data (migrated into
  IndexedDB automatically on first load, nothing deleted).
- **Nothing is sent to the server or any third party.** The app works fully
  with no AI key. AI use is copy-paste only: briefing packs are built
  locally, redacted by default (real names → source IDs), and shown before
  the owner copies anything anywhere.
- Multiple projects are supported; imports land alongside existing work.

## 3a. Tell your story — Record it / Write it (the capture workflow)

Two equal doors into one protected pipeline (2026-08-04):

> Raw Source → Proposed Interpretation → Author Edited → Approved Fiction →
> Manuscript

- **Source material** (`app/engines/story/source.engine.ts`) — every capture
  gets a stable private id (`SM-0001`, `SM-0002`, …) that never contains
  names or content, plus a kind (spoken / typed / pasted), a derived
  processing stage, and an append-only history.
- **The original is write-once.** For typed/pasted sources it is the exact
  submitted text (untrimmed). For spoken sources it is the word-for-word
  transcript, with the original audio preserved separately in the `audio`
  store. Edits and transcript corrections are appended as versions; no code
  path can change an original after capture.
- **Spoken path** (`recorder.ts`) — in-browser MediaRecorder with pause /
  resume / cancel / finish and playback before saving. The browser's own
  speech recognition produces a live transcript when it can; when it can't
  (unsupported browser, blocked service), the recording still saves and the
  owner types the word-for-word transcript once — after which it is
  permanent like any original. No API keys, no uploads.
- **One question at a time** — deterministic, material-responsive questions
  ("What was left unsaid?" surfaces when people appear in the text). Always
  answerable, skippable, or savable for later; nothing downstream is gated
  on answering.
- **Proposed story ingredients** — deterministic suggestions drawn from the
  owner's own words and answers (emotional truth, central conflict, setting,
  turning point, …). Every proposal is labeled **Suggested by Story
  Partner** and holds one of five states: proposed / undecided /
  author-edited / author-approved / rejected. Editing preserves the verbatim
  proposal alongside the owner's text.
- **Real-to-Fiction Bridge** — before directions are offered, the source
  must be mapped in the Legend (vault mappings now carry
  `sourceMaterialIds`, so the bridge is many-to-many in both directions:
  several sources → one mapping, one source → several mappings).
- **Three scene directions** — structurally different by construction
  (viewpoint, chronology, hidden vs. open conflict, who holds power), each
  explaining what happens, whose scene it is, want, obstacle, change, and
  why it may serve the saga. The owner can approve, edit, reject all,
  request a different trio, or write their own.
- **The manuscript gate** (`capture.engine.ts`,
  `addApprovedSceneToManuscript`) — the only door from this workflow into
  the manuscript. It refuses any direction that is not author-approved,
  refuses empty text, and is idempotent (repeat approval returns the same
  scene, never a duplicate). The approved scene lands in a chapter with the
  draft note "Approved by Author"; the direction records the scene id as
  private lineage (source → direction → scene).
- **Manuscript export** (The Novel → "Export manuscript (.md)") — compiles
  chapter titles and current scene prose only, then runs
  `manuscriptLeakScan`: private ids (SM-/MAP-/REAL-/FI-), Legend real
  names, never-publish details, verbatim source passages, and stray
  suggestion labels all **block the download** with a plain explanation.

## 4. Revisions — every draft preserved

- Scene drafts were already append-only. On top of that, the whole project
  gets revisions (`app/engines/story/revisions.ts`):
  - **Autosaves** — background, at most one per 2 minutes of editing; the
    newest 20 are kept.
  - **Manual saves** — permanent.
  - **Named checkpoints** — permanent and protected by construction
    ("Owner read-through", "Continuity pass", …).
- Pruning can only ever drop plain autosaves beyond the keep window.
- **Restore parks first:** restoring an older revision saves the current
  state as a protected checkpoint before applying the snapshot. Both
  branches always survive. Compare shows count-level differences honestly.
- **Published editions are immutable.** Freezing an edition stores the exact
  compiled manuscript; no function in the codebase can edit or delete one.
  A correction is a new edition ("Corrected First Edition").

## 5. Backups — two kinds, deliberately different

| | Creative Project Backup | Complete Owner Vault Backup |
|---|---|---|
| Contains | The fictional project only | Project **plus** the Real-to-Fiction Legend **plus** original recordings |
| Real identities | **Excluded by design** | **Included** |
| Recordings | Not included | Included as base64 (formatVersion 2; v1 backups still restore) |
| Filename | `<title>-<date>.json` | `PRIVATE-COMPLETE-OWNER-BACKUP-<date>.json` |
| When to use | Routine backups, future sharing | The real safety net; store privately |

Note: the Creative Project Backup carries the full project — including raw
source material and memories — because it is a *backup*, not a share file.
The only share-grade output is the manuscript export, which is leak-scanned
(see §3a). Restoring an owner backup restores the recordings too, with
fresh ids on collision (the sources' audio references follow).

- The owner backup requires an explicit confirmation and carries a
  HIGHLY SENSITIVE notice inside the file.
- **Restores never overwrite.** Imports are validated (`sanitize*` — never
  executed), land as a separate copy, and an id collision gets a fresh id
  with the vault remapped to follow. Corrupt or foreign files are rejected
  with a plain error.
- Where supported (Chromium), a **local writing folder** can be chosen and
  backups written into its `Backups/` subfolder with versioned names, never
  overwriting. The browser re-asks after a reload — its own safety rule.
  Elsewhere the fallback is ordinary downloads.

## 6. The Real-to-Fiction Legend (Source Identity Vault)

Unchanged from its original build (owner-only screens, SRC ids,
many-to-many rename-safe mappings, identity-leakage review, redacted AI
packs, PRIVATE-prefixed export) — plus:

- **Separate storage** in its own IndexedDB object store; excluded from
  creative backups and ordinary serialization.
- **Optional real encryption** (`app/engines/story/vault.crypto.ts`):
  AES-256-GCM under a PBKDF2-SHA-256 key (310k iterations), Web Crypto only.
  - Opt-in, with a double passphrase entry and explicit warnings.
  - While sealed, the vault is ciphertext everywhere — IndexedDB holds only
    the envelope, the localStorage mirror drops it, and a plain write cannot
    clobber a sealed vault.
  - Unlocking holds the decrypted vault in page memory only; locking,
    leaving the room (logout locks all vaults), refreshing, or closing the
    tab seals it again.
  - **The passphrase is NOT recoverable.** No reset, no escrow. A forgotten
    passphrase means that vault is gone — the Complete Owner Vault Backups
    made before/while encrypting are the safety net. The UI says exactly
    this before letting the owner turn it on.
  - The courtesy lock (session code) still exists for shared-device
    politeness; encryption is the real protection.

## 7. Threat model, plainly

| Threat | Protected? |
|---|---|
| Internet visitors / search engines | Yes — server auth, noindex, no-store |
| Reading the client bundle for secrets | Yes — no password or private data ships |
| Someone with Vercel project access | No — they can read/rotate the env password |
| Someone at the owner's unlocked computer | Partially — vault encryption when locked; the project itself is readable in this profile |
| Malicious browser extension | No, while the room is open in that profile |
| Browser-data clearing / device failure | Only via backups — see disaster recovery |
| Stolen **owner backup file** | No — it contains everything; store it accordingly |
| Stolen **encrypted vault at rest** | Yes — AES-256-GCM ciphertext |
| Accidental Git commit of private data | Guarded — gitignore patterns + invented-data-only rule |
| Accidental AI transmission | Guarded — no network AI calls exist; copy-paste only, redacted by default |

## 8. Disaster recovery — owner's guide

**Where is my writing?** In this browser's IndexedDB (plus a localStorage
mirror), on this device. Backups you download are ordinary files. Nothing is
on the server.

**Where is the Legend?** Same device, separate store. If you enabled
encryption it sits there as ciphertext under your passphrase. It is only in
`PRIVATE-COMPLETE-OWNER-BACKUP-*` files, never in creative backups.

**I cleared the browser / the browser broke.** Everything local is gone.
Restore: open `/author`, log in, Revisions & backups → Restore from a backup
file → pick your newest backup. A Creative backup restores the project; an
Owner backup restores the Legend too.

**The computer died.** Same as above, on the new computer, using a backup
file you kept elsewhere (drive, cloud you trust, printed nothing). If your
only copies were on the dead machine, the writing is lost — this is why the
room nags about backups.

**Vercel / the deployment disappears.** Your writing is unaffected (it was
never there). The backup files are plain JSON — readable anywhere, even
without this app. Redeploy the repo, set the env vars, log in, restore.

**I forgot the login password.** Set a new `STORY_OWNER_PASSWORD` in Vercel
and redeploy. No writing is affected.

**I forgot the vault passphrase.** The sealed vault cannot be opened —
truly. Restore the Legend from your newest Complete Owner Vault Backup
(import as a copy), and re-enable encryption with a passphrase you'll keep.

**Moving to a new computer.** Old machine: download both backup kinds. New
machine: log in at `/author`, restore the Owner backup, verify, then delete
the transfer copies if the medium wasn't private.

**Proving backups work.** Periodically: restore your newest backup — it
imports as a separate copy, so nothing is at risk — check it opens and
reads, then keep or discard the copy. A backup is not real until a restore
has been seen to work.

**Which file could ever be shared?** Only Creative Project Backups (they
carry no real identities), and only when you choose to. `PRIVATE-*` files:
never.

## 9. Family testing — deferred on purpose

There is no family access, no tester password, no read-only mode in this
release, and the owner password must not be shared as one. A future family
phase needs its own authentication, revocable per-person access,
snapshot-based review, and hard exclusion of the vault, raw memories, and
owner notes. The clean extension point is the server-side session check in
`app/author/page.tsx` (a second, limited role) plus snapshot exports that
already exist (editions / creative backups).

## 10. Known limitations (honest list)

- Rate limiting is per-serverless-instance memory — a distributed attacker
  is slowed mostly by the password's strength.
- Browser `bfcache` may briefly show the last-rendered page after logout via
  the back button on some browsers; `no-store` mitigates but the real
  protection is locking the vault and closing the tab on shared machines.
- The local-folder permission is session-scoped (browser rule) and
  Chromium-only today.
- Autosave revisions capture at most one snapshot per 2 minutes; the
  in-between keystrokes live in the working copy (which is itself saved on
  every change).
- IndexedDB can be cleared by the browser under storage pressure in extreme
  cases; the mirror + backup reminders exist for exactly that reason.
