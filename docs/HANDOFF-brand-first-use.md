# Handoff: brand and first-use pass (2026-11-05)

Read this first if you are picking up this work. It replaces the 2026-10-22
"workshop, no AI mentions" direction. `CLAUDE.md` carries the rules; this file
carries the state.

## The brief, in one paragraph

People step into a creative space, work with AI, and keep refining until they
get what they want, with no coding. Useful to kids, students, professionals and
grandparents. Plain, low-key, human. No "vibe coding" in public copy, no hype, no
fight, not a manifesto. Keep working features and the visual identity.

## The promise as shipped

- Under the wordmark: "A workspace for making things with AI"
- Hero: "Make it with AI. Keep going until it's right."
- Box: "What do you want to make?" Button: "Start"
- The name: getting in and doing it yourself instead of watching from the seats.
  You and the AI are on the same side.
- The honest mechanism: **the site does not run an AI.** It writes the first
  message, the person pastes it into ChatGPT, Claude, Copilot or Gemini
  (alphabetical, none recommended), and when it answers the site writes the next
  message from what they say is off.

## What changed

**The screen after the box is now a workspace.** Before, it showed what the rules
guessed ("A piece of content", "Real means: published where its audience actually
is", "Keep this build") and never mentioned an AI. Now it shows the person's own
words, a first message to copy, links to the apps, and "When it answers": five
moves (Change something, It didn't work, I don't understand, Try another way,
It's right) that turn what they type into the next message. The plan and brief
are one click away under "See the whole plan". Nothing was removed.

**Everyday ideas read correctly.** Study guides, cookbooks, handbooks, slideshows,
checklists and family trees are now a "guide" form (they used to get HTML as a
tool, or a fiction brief for a book of recipes). "I need help with..." is help, a
work plan is a plan, a flashcard app is an app. "Track" no longer suggests the
Music Engine, "guide" no longer suggests How To, and "Your first build" no longer
appears on a birthday poem.

**Leaving and coming back works.** Saved the moment the workspace opens. The URL
says `?open=workspace` or `?open=plan` (never the words), so a phone reloading the
tab, Back and Forward, and links on the same page all land correctly.

**Typed text stays out of URLs.** "Continue" in Your work and the first version
cutter used to put the person's words in `/create?idea=...`, which Google
Analytics reads, despite "we never count what you type". Fixed, and words arriving
from another site by `?idea=` or `?cr=` are scrubbed from the address bar on
arrival. Checked in a production build with a marker word: no request contained it.

**Navigation:** Create, How it works, Tools, Your work, Made here, plus What works
today. Engines left the bar (still a full door on the home page and /tools, and in
the footer). "Owner's Builds" became "Made here", "What's built" became "What works
today". Routes are unchanged.

**Copy:** /, /create, /how, /about, /tools, /engines, /whats-built, /builds, /build,
/everything, engine descriptions (and two stale "scored" claims), page metadata,
the share image, the app manifest and the README. Boxing glove emoji removed.

**Owner usage view:** "Ideas started", "First messages copied", "Next messages
copied". The last one is the real test of the promise.

**A router quirk to know about.** Next (16.2.9) seeds its route cache with the URL
of the first load, so a later link to that same page gets that query string back.
That made the wordmark a dead click after a reload and could have put typed words
back in the URL. `app/site/arrival.ts` moves these parameters out of the address
bar in a head script, before the router or analytics read it. Don't add a new
query parameter to `/` or `/create` without adding it there. A link to those pages
that carries one must be a plain `<a>`, because even a prefetch of a `<Link>` makes
the router remember the query (a test checks this).

## Key files

- `app/site/brand.ts`: the few lines that say what this is. One copy of each.
- `app/create/ai-messages.ts`: first and next messages. Pure and deterministic.
- `app/create/WorkWithAI.tsx`, `app/vnext/SteppedIn.tsx`: the workspace.
- `app/create/RingApp.tsx`: home page, stage and URL handling.
- `app/create/starting-points.ts`: `HOME_STARTERS`, `HOME_EXAMPLES`.
- `app/creation/classify.ts`, `profile.ts` (`GUIDE_WORDS`), `adapters.ts`.
- `app/site/brand.test.ts`, `app/create/workspace.test.ts`,
  `app/create/ai-messages.test.ts`: what holds all this in place.
  `app/creation/quality.test.ts` has a fixture for everything the home page promotes.

## Needs a product decision

1. **Built-in AI?** People leave the site to work with the AI. A chat inside the
   workspace would feel more like one room, but it means API cost, moderation, and
   minors on a paid service. Recommendation: wait and watch "Next messages copied".
   If people aren't coming back after the first message, that is the argument.
2. **"Built with Step In The Ring" on CrossHeartPray.** The home page now says
   "make it with AI" just above that card, so a reader may infer CrossHeartPray's
   content came from AI. No new claim was added about any site, and CrossHeartPray
   keeps its own rules about Scripture. Worth the owner's eye.
3. **Third-party wording.** Four AI apps are named and linked, and "most let you
   start without paying" appears. That is a fact about other companies, allowed
   under the 2026-10-17 copy rule, not a claim about this site. Plans change, so
   it needs an occasional check.
4. **Nav renames.** Engines out of the bar, "Made here", "What works today". Each
   is one line in `app/site/registry.ts` to reverse.
5. **"Vibe coding" as a search term.** Left out of public copy as the brief asked.
   If people search for it, one line on /how would catch them, for example "Some
   people call this vibe coding. Here it just means you describe it and keep
   steering." Not shipped.
6. **Getting it online.** `/build` is the only path from "the AI made me a file" to
   a web address, and it uses a terminal, GitHub, Vercel and a paid domain. It says
   so plainly, but it is the least no-coding thing linked from the home page. A
   simpler publish path would be a project of its own.

## Tested in real AI apps (2026-11-08, no sign-in)

- **ChatGPT:** all four `HOME_EXAMPLES` first messages. Each time it made a first
  version at once, left clear blanks (names, phone, address), gave plain steps
  to save and open the code, and asked what to change. A change message
  ("Shorter, and keep the part about riding through the fields") kept the rest
  and showed the whole poem again.
- **Gemini (free Flash-Lite):** the dragon game and the poem, with the same
  result. Its first game worked only with arrow keys, so it couldn't be played
  on a phone. The code line now asks for "one file that works in a web browser
  and on a phone", and the rerun came back with touch controls.
- **Copilot and Claude:** both sent a visitor to sign in, so neither was tested.
  The site's wording ("separate from this site, with their own accounts", "most
  let you start without paying") is still true.
- Logged-out ChatGPT now shows ads under answers. That is the app's own doing,
  but worth knowing before recommending any one app.

## Not verified

- Copilot and Claude. On 2026-11-08 both needed a sign-in, so the first messages
  were tested only where no account was needed (see "Tested in real AI apps").
- The real clipboard (the browser pane blocks it). The copied text was checked with
  a stubbed clipboard, and the "couldn't copy" path for real.
- A real phone dropping the tab. A reload at phone size was tested.

## Open follow-ups elsewhere

- The hub's listing was updated on 2026-11-06 (`open-mirror` 9f4dcf6). Its door and
  card say AI; its About line deliberately doesn't, because that page never mentions
  AI or build tooling. The door keeps the owner's subtitle, "Build an idea".
- iDontCry's four buttons that lead here lost the boxing glove on 2026-11-07
  (`idontcry` 8dcf8402: `GameLab.tsx` twice, `MakeHub.tsx`, `CreativeStudio.tsx`). Their words stayed,
  because iDontCry keeps its own no-AI copy rule. Its `src/lib/sisterHandoffs.test.ts`
  fails if any file that links here carries the glove.
- The kit branch (`kit-one-time-purchase`) is untouched. A test merge onto this work
  was clean: no conflicts, 1,601 tests passing, typecheck clean. Sales stay closed.

## Exact next steps, if continuing

1. Watch `/owner/usage` for a week: ideas started, first messages copied, next
   messages copied.
2. Try the first messages in Copilot and Claude from a signed-in account. A
   first message must stay under 140 words (`ai-messages.test.ts`).
3. Take the decisions above to the owner.

## Ship rule

Owner's standing rule: commit and push verified work to `main` (= production) with
a rollback tag first. `npx eslint app` must report 0 errors before a push. Rollback
for this pass: local tag `live-before-brand-first-use-20261105`.
