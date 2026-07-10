// Engine-specific specialty output generators (Pass 2 deepening).
// Each engine's `specialties` field maps to dedicated sections that dig deeper
// into engine-specific outputs, not generic filler.
import type { Engine, BuildStage } from "./engines";

type A = Record<string, string>;
const val = (a: A, k: string) => (a[k] ?? "").trim();
const or = (a: A, k: string, fallback: string) => (val(a, k) ? val(a, k) : `(${fallback})`);
const has = (a: A, k: string) => val(a, k).length > 0;
const bullets = (items: string[]) => items.filter(Boolean).map((s) => `- ${s}`).join("\n");

type SpecialtyFn = (e: Engine, a: A, stage: BuildStage) => string;

// ---- IDEA ENGINE ----
const ideaSpecialties: Record<string, SpecialtyFn> = {
  "Clarified concept": (e, a) => {
    const rough = or(a, "rough", "your idea");
    const why = val(a, "why") ? `\nWhy it matters to them: ${val(a, "why")}` : "";
    const excites = val(a, "excites") ? `\nWhat excites you most: ${val(a, "excites")}` : "";
    return `Strongest interpretation of "${rough}".${why}${excites}`;
  },
  "Simplest real test": (e, a) => {
    const who = or(a, "who", "your target user");
    const constraint = val(a, "constraint");
    if (constraint && constraint.toLowerCase().includes("week")) {
      return `This week:\n- Find 3 ${who}s (in person, Discord, or email).\n- Describe the idea in 1 sentence.\n- Ask: Does this solve a problem for you? Would you pay for it?\n- Document their answers (yes/no/maybe).`;
    }
    return `Recruit 3–5 ${who}s. Describe the concept in your own words. Ask if it solves a real problem for them. Document the yes/no/maybe answers.`;
  },
  "Reasons to pursue or pause": (e, a) => {
    const pursue = [];
    const pause = [];
    if (val(a, "excites")) pursue.push("You're excited about it — that matters for motivation.");
    if (val(a, "why")) pursue.push("Clear problem for the target user — a real pain point.");
    if (!val(a, "exists")) pursue.push("No competitor mentioned — potential first-mover advantage.");
    if (!val(a, "constraint")) pause.push("No resource constraint stated — check energy/time/money realism.");
    if (!val(a, "who")) pause.push("Target user not specific enough — risk of building for everyone, helping no one.");
    if (pursue.length === 0 && pause.length === 0) {
      return "Run the test first. Evidence beats hunches.";
    }
    const body = [pursue.length ? `Pursue if:\n${bullets(pursue)}` : "", pause.length ? `Pause if:\n${bullets(pause)}` : ""];
    return body.filter(Boolean).join("\n\n");
  },
  "Next step": (e, a) => {
    if (!has(a, "who")) return "First: pick one specific person or small group who has the problem.";
    if (!has(a, "why")) return "First: nail down WHY it matters to them — the real problem it solves.";
    return `Run the simplest test this week:\n1. Find 3 target users.\n2. Show them the concept.\n3. Ask: does it solve a problem? Would you pay?\n4. Bring the answers back to StepInTheRing.\nThen decide: Build (high clarity), Refine (confused response), or Park (no signal).`;
  },
};

// ---- BUILD ENGINE ----
const buildSpecialties: Record<string, SpecialtyFn> = {
  "Product definition": (e, a) => {
    return [
      `Name: ${or(a, "name", "unnamed")}`,
      `What it is: ${or(a, "purpose", "as you described")}`,
      `Who it's for: ${or(a, "who", "a specific user")}`,
      `The core action: ${or(a, "core", "the one thing that helps them")}`,
      `Constraint: ${or(a, "constraint", "none stated")}`,
    ].join("\n");
  },
  "Core user journey": (e, a) => {
    const action = or(a, "core", "do the one thing");
    return `1. User opens it.\n2. They see the one thing they came for.\n3. They ${action}.\n4. They see the result immediately.\n5. They know what to do next or can come back later.`;
  },
  "MVP scope": (e, a) => {
    const core = or(a, "core", "the core action");
    return `Launch with only: the ${core}, one way to see the result, and a way to come back.\nDefer: accounts, personalization, admin panels, advanced settings, social features, monetization, analytics, email integrations.`;
  },
  "Architecture & components": (e, a, stage) => {
    return [
      `Routes: one route for the core action; defer others.`,
      `State: ${or(a, "exists", "local-first")} — use the simplest persistence that works.`,
      `Components: extract only if reused; match existing conventions.`,
      `Error handling: external failures degrade gracefully (no blank page).`,
      `Mobile: one-handed use; tap targets ≥ 44px; no horizontal overflow.`,
    ].join("\n");
  },
  "Deployment path": (e, a) => {
    const exists = val(a, "exists").toLowerCase();
    if (exists.includes("vercel") || exists.includes("next")) return `Push to main → auto-deploys on Vercel.`;
    if (exists.includes("github") && exists.includes("pages")) return `Push to main → GitHub Pages auto-deploys.`;
    if (!val(a, "exists")) return `New project: create a Next.js repo, push to GitHub, connect to Vercel, deploy on push to main.`;
    return `Confirm deployment pipeline from the existing repo before the build starts.`;
  },
};

// ---- SELL ENGINE ----
const sellSpecialties: Record<string, SpecialtyFn> = {
  "Customer & problem": (e, a) => {
    return [
      `Target buyer: ${or(a, "customer", "as you described")}`,
      `Their problem: ${or(a, "problem", "the pain it solves")}`,
      `Why they'd pay: because it saves them time, money, or sanity.`,
    ].join("\n");
  },
  "Offer & format": (e, a) => {
    return [
      `What they get: ${or(a, "product", "as you described")}`,
      `Format: ${or(a, "channel", "a landing page + one transaction method")}`,
      `Simplest delivery: ${val(a, "exists") ? "leverage existing tech" : "digital download or in-person handoff"}`,
    ].join("\n");
  },
  "Price hypothesis": (e, a) => {
    return `Start with one price that feels fair to you and the buyer. Test if they'll actually pay it — that's the real validation, not the number.`;
  },
  "Sales-page requirements": (e, a) => {
    return [
      `One headline: what it is + who it's for.`,
      `Why it matters: the problem it solves.`,
      `What they get: specific, concrete.`,
      `Price: clear, no surprise fees.`,
      `One call-to-action: Buy Now / Sign Up / Download.`,
      `How to reach you if they have questions: email or Slack.`,
    ].join("\n");
  },
  "Delivery process": (e, a) => {
    if (val(a, "exists").toLowerCase().includes("gumroad") || val(a, "channel").toLowerCase().includes("gumroad")) {
      return `Gumroad product → buyer pays → they get a download link.`;
    }
    if (val(a, "exists").toLowerCase().includes("etsy") || val(a, "channel").toLowerCase().includes("etsy")) {
      return `Etsy listing → buyer pays → ship or fulfillment vendor handles it.`;
    }
    return `Landing page (Webflow, Carrd, or plain HTML) → Stripe checkout or Gumroad → automated email with download or manual handoff.`;
  },
  "First validation test": (e, a) => {
    const customer = or(a, "customer", "one real buyer");
    return `Launch to 10–20 people (friends, email list, or ads). Ask: would you actually buy this?\nSuccess: at least 3 yeses and 1 actual sale.`;
  },
};

// ---- LAUNCH ENGINE ----
const launchSpecialties: Record<string, SpecialtyFn> = {
  "Readiness assessment": (e, a) => {
    const worried = val(a, "worried");
    if (!worried) return `The product is ready if:\n- It works in a browser.\n- The main user journey completes.\n- There are no data-loss or security red flags.`;
    return `You're worried about: ${worried}\n\nAssess that FIRST before launch. Fix only actual blockers, not nice-to-haves.`;
  },
  "Remaining blockers": (e, a) => {
    const worried = val(a, "worried");
    if (!worried) return `Inspect the product for:\n- Broken journeys or dead links.\n- Missing error messages.\n- Mobile display issues.\n- Unclear copy or next steps.`;
    return `The main blocker: ${worried}.\n\nOnly fix if it stops people from using it. Polish later.`;
  },
  "Production checks": (e, a) => {
    return [
      `Domain + DNS: working, no downtime warnings.`,
      `HTTPS: enabled everywhere.`,
      `Mobile: no horizontal overflow, tap targets ≥ 44px.`,
      `Error handling: external failures don't break the flow.`,
      `Copy: typos fixed, legal disclaimers present if needed.`,
      `Monitoring: error reporting + traffic tracking in place.`,
    ].join("\n");
  },
  "Launch message & channel": (e, a) => {
    const audience = or(a, "audience", "your first audience");
    return [
      `Channel: where ${audience} hangs out (email list, Twitter, Slack, in person).`,
      `Message: one sentence of what it is + why they should try it.`,
      `Call to action: "Try it here: [URL]" or "Sign up: [link]".`,
      `When: send 24–48 hours after confirming all checks pass.`,
    ].join("\n");
  },
  "Feedback loop": (e, a) => {
    return `Collect feedback immediately:\n- Have users email you with questions / bugs.\n- Watch for errors in your monitoring dashboard.\n- Note anything that stops them — that's the next fix cycle.`;
  },
  "First measurable result": (e, a) => {
    return `Target: ${or(a, "measure", "your stated result")}\n\nVerify it by:\n- Checking traffic / signup logs in 48 hours.\n- Counting actual users who completed the main action.\n- Asking early users for feedback.`;
  },
};

// ---- FIX ENGINE ----
const fixSpecialties: Record<string, SpecialtyFn> = {
  "Symptom & evidence": (e, a) => {
    return [
      `What you see: ${or(a, "symptom", "the exact issue")}`,
      `Where: ${or(a, "journey", "which user journey")}`,
      `When it started: ${or(a, "when", "unclear — must inspect repo")}`,
    ].join("\n");
  },
  "Likely root cause": (e, a) => {
    return `Must be inspected from the repo. Do not guess.\nPossibilities:\n- A recent commit broke it.\n- An external API dependency failed.\n- Browser cache / stale build.\n- User state corruption.`;
  },
  "Inspect-first plan": (e, a) => {
    return [
      `1. Check git log for recent changes.`,
      `2. Reproduce the exact symptom in a fresh browser session.`,
      `3. Read the affected code path.`,
      `4. Identify what changed and why.`,
      `5. Find the smallest change that would fix it.`,
      `6. Write a regression test BEFORE the fix.`,
    ].join("\n");
  },
  "Protected functionality": (e, a) => {
    return `Must NOT change:\n${or(a, "protect", "everything that works today")}\n\nVerify these still work after the fix.`;
  },
  "Repair prompt": (e, a) => {
    return `Claude Code will receive:\n- The exact symptom and journey affected.\n- What changed recently (from git).\n- What must be protected.\n- A regression-test requirement before landing the fix.`;
  },
  "Regression tests": (e, a) => {
    return `Add a test that:\n1. Sets up the scenario from before the break.\n2. Verifies the protected functionality still works.\n3. Confirms the symptom is fixed.\n4. Runs in CI and must pass before merge.`;
  },
};

// ---- GROW ENGINE ----
const growSpecialties: Record<string, SpecialtyFn> = {
  "Current evidence": (e, a) => {
    return `What you know right now:\n${or(a, "evidence", "gather numbers: traffic, signups, sales, usage patterns, user feedback")}`;
  },
  "The bottleneck": (e, a) => {
    return or(a, "bottleneck", "where people drop off or stall");
  },
  "Growth hypothesis": (e, a) => {
    const guess = val(a, "guess");
    if (guess) return `Your guess: ${guess}\n\nTest it.`;
    return `Based on the bottleneck, form one hypothesis:\nIF we [change X], THEN [bottleneck improves] BECAUSE [reason].\n\nExample: IF we show the ROI first, THEN sign-up rate improves BECAUSE users see the payoff.`;
  },
  "Smallest experiment": (e, a) => {
    return [
      `Do NOT build the full solution yet.`,
      `Design the tiniest change that would test the hypothesis.`,
      `Examples: a one-line copy change, a different button color, reordering one section.`,
      `Run it for 1–2 weeks. Measure the result.`,
    ].join("\n");
  },
  "Measurement & decision rule": (e, a) => {
    const measure = or(a, "measure", "the target number");
    return `What you're measuring: ${measure}.\n\nDecision rule: IF it moves by [X]%, do [build full solution / try a different hypothesis / pause this avenue].\n\nBe specific about the threshold before starting.`;
  },
  "Next experiment (only after evidence)": (e, a) => {
    return `ONLY plan this after the first test is done and you have evidence.\n\nDo NOT start multiple experiments in parallel — you won't know what caused the result.`;
  },
};

// ---- PLAN ENGINE ----
const planSpecialties: Record<string, SpecialtyFn> = {
  "Outcome & current state": (e, a) => {
    return [
      `Outcome: ${or(a, "outcome", "as you described")}`,
      `Current state: ${or(a, "situation", "where things stand")}`,
    ].join("\n");
  },
  Milestones: (e, a) => {
    return [
      `Phase 1: [name] — [milestone] by [date].`,
      `Phase 2: [name] — [milestone] by [date].`,
      `Phase 3: [name] — [milestone] by [date] (if needed).`,
      `\nWhat marks completion of each phase? Be specific.`,
    ].join("\n");
  },
  "Dependencies & owners": (e, a) => {
    return [
      `What must happen before what? List dependencies.`,
      `Who owns each phase? (even if it's just you)`,
      `Who are the decision-makers?`,
      `Who needs to unblock whom?`,
      or(a, "people", "Roles not named — clarify before starting."),
    ].join("\n");
  },
  Timeline: (e, a) => {
    const deadline = val(a, "deadline");
    if (deadline) return `Hard deadline: ${deadline}\n\nWork backward from that date to lock the phase dates.`;
    return `No hard deadline stated. Estimate realistically: how long for each phase?`;
  },
  Risks: (e, a) => {
    return [
      `What could delay or break this?`,
      `Resource constraints: time, money, people, skills.`,
      `External dependencies: vendors, approvals, third parties.`,
      `How will you know early if you're off track?`,
    ].join("\n");
  },
  "Immediate next action": (e, a) => {
    return `Right now (this week):\n1. [specific action]\n2. [specific action]\n3. [specific action]\n\nDone by [day]: [person]. No boiling the ocean.`;
  },
};

// ---- ETSY ENGINE ----
const etsySpecialties: Record<string, SpecialtyFn> = {
  "Product decision & recommendation": (e, a) => {
    const concern = val(a, "concern");
    return [
      `Recommendation: [Build First / Refine / Park / Avoid]`,
      `Reasoning: based on buyer clarity, production fit, brand alignment.`,
      concern ? `Main concern: ${concern}\n\nMitigation: ...` : `No major concerns stated — verify during listing draft.`,
    ].join("\n");
  },
  "Etsy listing draft": (e, a) => {
    return [
      `Title (140 chars): [catchy + keyword-rich]`,
      `Short description (2–3 sentences): what it is, who it's for, why they'd buy.`,
      `Long description (5–7 bullets): features, use case, materials, dimensions if applicable.`,
      `Tags (13): high-volume + niche keywords your buyer would search.`,
      `Price hypothesis: based on production cost + 3x markup.`,
    ].join("\n");
  },
  "Organic social launch pack": (e, a) => {
    return [
      `Hooks (3 variations): one-liners that stop the scroll.`,
      `Captions (2–3 versions): short story or benefit + CTA.`,
      `Reel/Story/post ideas: showcase the product, behind-the-scenes, customer testimonial.`,
      `Hashtags (15–20): mix high-volume + niche.`,
      `Posting schedule: Tues/Thurs/Sat at [time your audience is active].`,
    ].join("\n");
  },
  "Fulfillment & production notes": (e, a) => {
    const format = val(a, "format").toLowerCase();
    if (format.includes("digital")) return `Digital fulfillment: send download link via Etsy email after purchase. No production cost.`;
    if (format.includes("handmade")) return `Handmade: produce to order, ship within 3–5 business days. Production cost per unit: [price]. Time per unit: [hours].`;
    return `${or(a, "format", "production method")}: set up with POD vendor or plan production timeline.`;
  },
  "Legal & trademark flags": (e, a) => {
    return [
      `Brand name used: check Open Mirror trademark policy.`,
      `Any quotes / designs from others? Ensure usage rights.`,
      `Etsy shop policy: set clear refund/shipping policy.`,
      `Tax: register for sales tax in your state if applicable.`,
    ].join("\n");
  },
  "Open Mirror placement guidance": (e, a) => {
    return `If launching under an Open Mirror brand:\n- Notify the hub (openmirrorllc.com).\n- Link back to TheDJCares or your site.\n- Share sales + feedback weekly.`;
  },
};

// ---- DESIGN SHOP ENGINE ----
const designShopSpecialties: Record<string, SpecialtyFn> = {
  "Product Spark & Clarification": (e, a) => {
    return [
      `Idea: ${or(a, "idea", "as you described")}`,
      `Customer: ${or(a, "customer", "who wants this")}`,
      `The spark: ${or(a, "spark", "the core phrase or problem")}`,
      `Product type: ${or(a, "productType", "undecided")}`,
      `Theme: ${val(a, "theme") ? a.theme : "(none specified)"}`,
      `Occasion: ${val(a, "occasion") ? a.occasion : "(general use)"}`,
    ].join("\n");
  },
  "Possible Product Directions": (e, a) => {
    const spark = or(a, "spark", "your idea");
    return [
      `1. Core Concept: ${spark} as a ${val(a, "productType").toLowerCase() || "product"}`,
      `2. Humorous Take: ${spark}, but funny`,
      `3. Educational Angle: ${spark}, but it teaches something useful`,
      `4. Seasonal / Timely: ${spark}, tied to a season, holiday, or moment`,
      `5. Bundle / Collection: ${spark}, plus complementary ideas in one package`,
      `\nEach direction opens a different market. Pick the one with strongest resonance.`,
    ].join("\n");
  },
  "Scoring Dimensions & Matrix": (e, a) => {
    return [
      `Rate each direction on these dimensions (1–5 scale):`,
      ``,
      `Fun (5 = delightful, 1 = boring): Does it spark joy?`,
      `Usefulness (5 = solves real problem, 1 = feels frivolous)`,
      `Giftability (5 = people buy for others, 1 = personal only)`,
      `Originality (5 = no competitors, 1 = very common)`,
      `Ease of Creation (5 = simple, 1 = very complex)`,
      `Digital-First Potential (yes/no): Can it launch as downloadable?`,
      `Bundle-ability (yes/no): Could this be part of a larger set?`,
      `Physical Reuse (yes/no): Can the design appear on multiple products?`,
      `Seasonality (5 = evergreen, 1 = highly seasonal)`,
      `IP Risk (5 = high risk, 1 = totally clear)`,
      ``,
      `Higher scores in Fun/Usefulness/Giftability + low IP Risk = green light.`,
    ].join("\n");
  },
  "Recommended Direction": (e, a) => {
    return `After scoring all 5 directions, select the one with the highest combined score in:\n- Fun + Usefulness + Giftability (what buyers want)\n- Low IP Risk (legal safety)\n- Creation Ease (can you actually build it?)\n\nDo not pick based on a single dimension.`;
  },
  "Design Package Template": (e, a) => {
    const productType = or(a, "productType", "TBD");
    return [
      `Title: ${or(a, "name", "Untitled")} — [direction label]`,
      `Concept: [full description of what this product is]`,
      `Customer: ${or(a, "customer", "TBD")}`,
      `Product Type: ${productType}`,
      `Format: [Printable, T-Shirt, Mug, Card, etc.]`,
      `Dimensions: [specific size]`,
      `Print Specs: [300 DPI, CMYK, bleed, etc.]`,
      `Colors: [list colors]`,
      `Fonts: [list fonts]`,
      `Materials: [if physical: fabric, ceramic, etc.]`,
      `Original Copy: [jokes, taglines, phrases unique to this]`,
      `Accessibility: [readable fonts, contrast, alt text for images]`,
      `Mockup Requirements: [front, lifestyle, detail shot]`,
      `Bundle Suggestions: [other products this pairs with]`,
    ].join("\n");
  },
  "Etsy Listing Draft": (e, a) => {
    return [
      `Title (140 chars max): [catchy + keyword-rich, include product type]`,
      ``,
      `Description (2–3 sentences):`,
      `What it is. Who it's for. Why they'd buy it.`,
      ``,
      `Long Description (5–7 bullets):`,
      `- What's included (files, physical items, etc.)`,
      `- Use case or scenario`,
      `- Dimensions / specifications`,
      `- What formats are provided`,
      `- Shipping / delivery info (digital or physical)`,
      `- Customization options (if any)`,
      `- Care instructions (if physical)`,
      ``,
      `Tags (max 13): keyword1, keyword2, ...`,
      `[Use high-volume keywords + niche specificity]`,
      ``,
      `Price Hypothesis: $[amount based on production cost + 3x markup]`,
      `Quantity Available: [1 for digital, 10+ for physical]`,
      `Processing Days: [0 for digital, 3–5 for physical]`,
    ].join("\n");
  },
  "Social Launch Kit": (e, a) => {
    return [
      `Instagram Caption (Hook 1):`,
      `[One-liner that stops the scroll about this product]`,
      ``,
      `Caption (Version 2):`,
      `[Longer version with benefit + CTA]`,
      ``,
      `Hashtags (15–20):`,
      `[Mix high-volume + niche keywords]`,
      ``,
      `Reel / Video Concept:`,
      `[15–30 second idea: unboxing, walkthrough, or demo]`,
      ``,
      `Stories / TikTok Hook:`,
      `[Fastest version: problem → product → solution in 5 sec]`,
      ``,
      `Publishing Schedule:`,
      `Tues/Thurs/Sat at [optimal time for your audience]`,
    ].join("\n");
  },
  "Fulfillment Path": (e, a) => {
    const productType = val(a, "productType").toLowerCase();
    if (productType.includes("digital") || productType.includes("printable")) {
      return [
        `Digital Fulfillment:`,
        `- Host file(s) on Etsy or your server`,
        `- Buyer receives download link via Etsy after purchase`,
        `- No production cost or shipping`,
        `- Can be updated/improved anytime`,
        `- Profit margin: ~80–90%`,
      ].join("\n");
    }
    if (productType.includes("print")) {
      return [
        `Print-on-Demand Fulfillment:`,
        `- Partner with Printful, Printednow, Merch by Amazon, etc.`,
        `- Upload files to POD vendor`,
        `- Orders come through Etsy → automatically sent to vendor`,
        `- Vendor produces + ships → customer receives`,
        `- Profit margin: ~40–60% (vendor takes cut)`,
        `- No upfront inventory cost`,
      ].join("\n");
    }
    return [
      `Fulfillment TBD - choose one:`,
      `1. Digital Download: deliver via Etsy (100% profit)`,
      `2. Print-on-Demand: use vendor (40–60% profit)`,
      `3. Handmade: produce yourself (variable profit, more work)`,
    ].join("\n");
  },
  "IP & Legal Checklist": (e, a) => {
    return [
      `Before publishing to Etsy, verify:`,
      ``,
      `✓ No direct celebrity references (Tom Brady, Elon, etc.)`,
      `✓ No copyrighted characters (Mickey, Elsa, Baby Yoda, etc.)`,
      `✓ No brand logos (Nike, Disney, Apple, etc.) unless licensed`,
      `✓ No song lyrics (protected by copyright)`,
      `✓ No famous movie quotes (protected by copyright)`,
      `✓ No trademarked phrases (Coca-Cola slogans, etc.)`,
      `✓ Design is original or properly licensed`,
      `✓ Images are your own or properly licensed (not stock without permission)`,
      ``,
      `If any flag appears, either:`,
      `- Remove the flagged element, or`,
      `- Seek legal permission before publishing`,
      ``,
      `Etsy will remove products that violate IP. Better to be cautious now.`,
    ].join("\n");
  },
};

const engineSpecialties: Record<string, Record<string, SpecialtyFn>> = {
  idea: ideaSpecialties,
  build: buildSpecialties,
  sell: sellSpecialties,
  launch: launchSpecialties,
  fix: fixSpecialties,
  grow: growSpecialties,
  plan: planSpecialties,
  etsy: etsySpecialties,
  "design-shop": designShopSpecialties,
};

export function generateSpecialties(
  engineId: string,
  specialtyTitles: string[],
  answers: A,
  stage: BuildStage,
): Record<string, string> {
  const specs = engineSpecialties[engineId] ?? {};
  const result: Record<string, string> = {};
  specialtyTitles.forEach((title) => {
    const fn = specs[title];
    result[title] = fn ? fn({} as any, answers, stage) : `(${title} — engine or specialty not found)`;
  });
  return result;
}
