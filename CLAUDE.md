@AGENTS.md

# StepInTheRing (stepinthering.com)
Idea-to-first-build coach, secular. Accent: **#60A5FA**.
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
