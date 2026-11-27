import Link from "next/link";
import "./starter.css";
import "./home2.css";
import { BRAND_OWNERSHIP } from "../site/brand";
import ArrivalForward from "./ArrivalForward";
import DevicePreview from "./DevicePreview";
import { draftFromExample } from "./draft";
import { EXAMPLES, exampleBySlug } from "./examples";
import MiniSite, { miniData } from "./MiniSite";
import { renderSite } from "./render";
import { PAID_HELP_OPEN } from "../site/paidHelp";

// THE FRONT DOOR (owner direction, Nov 25 2026): one Step In The Ring for
// trying, learning, creating, building and starting something of your own.
// The purpose is obvious in one line; the website examples stay the strongest
// door. No prices and no package list. Owner direction (Nov 26-27 2026): the
// download is free again; professional help is an email. No invented
// clients, numbers or promises.

const SHOWCASE = "mobile-dog-groomer";
const FEATURED = ["handyman", "hair-stylist-barber", "house-cleaner", "personal-trainer", "food-truck", "graphic-designer"];

// Five ways in, one line each (owner direction, Nov 25 2026).
const VERBS = [
  ["Try something", "The Heisman: one pose, both sides, two minutes.", "/ring"],
  ["Learn something", "Check the computer you have and set it up to build.", "/products/ready-to-build"],
  ["Create something", "Say what you want to make and get a clear message for your AI app.", "/make"],
  ["Build something", "29 website examples to make your own.", "/start"],
  ["Start something", "Guided steps for a launch plan, a price to test or a plan for an event.", "/engines"],
] as const;

// Doors into the engines, named by the job, not the engine (2026-11-18).
const DOORS = [
  ["Plan your launch", "Two weeks of checks and messages for when your site goes live, and one result to count.", "/engines/room?engine=launch"],
  ["Price a service or product", "Who it's for, an offer, a price to test and a first test to run.", "/engines/room?engine=sell"],
  ["Get more calls and bookings", "One change to try, how long to run it, and how to read the result.", "/engines/room?engine=grow"],
  ["Plan an event or a season", "Steps, who does what, dates, risks and the next thing to do.", "/engines/room?engine=plan"],
] as const;

const PROCESS = [
  ["Choose an example", "Pick the business closest to yours. Each one is written for that kind of work."],
  ["Make it yours", "Your name, area and contact details. Then change the words, colors, photos and sections."],
  ["Download your files", "One download with your page, your photos and a short guide to putting it online."],
] as const;

export default function StarterHome() {
  const ex = exampleBySlug(SHOWCASE) ?? EXAMPLES[0];
  const html = renderSite(draftFromExample(ex), { mode: "preview" });
  const featured = FEATURED.map((s) => exampleBySlug(s)).filter((e): e is NonNullable<typeof e> => Boolean(e));

  return (
    <main className="sh h2">
      <ArrivalForward />

      <section className="h2-hero">
        <div className="h2-hero-copy">
          <p className="h2-kicker">Step In The Ring</p>
          <h1>Make something real. <span>One step at a time.</span></h1>
          <p className="h2-lead">
            Try a challenge, learn a skill, make a website or start a business of your own. Start with an
            example written for your kind of work, and see it on a phone as you go. It&apos;s free to try.
          </p>
          <div className="h2-go">
            <Link className="h2-btn h2-btn-main" href="/start">Choose your example</Link>
            <Link className="h2-btn h2-btn-alt" href="/products">All the ways to make it real</Link>
          </div>
        </div>
        <div className="sh-show h2-show" aria-label={`Example: ${ex.name.toLowerCase()}`}>
          <div className="sh-show-desk"><DevicePreview html={html} title={`Example website for a ${ex.name.toLowerCase()}, desktop`} initial="desktop" hideToggle /></div>
          <div className="sh-show-phone"><DevicePreview html={html} title={`Example website for a ${ex.name.toLowerCase()}, phone`} initial="phone" hideToggle /></div>
          <Link className="sh-show-cap" href={`/examples/${ex.slug}`}>Example: {ex.name.toLowerCase()}&nbsp;→</Link>
        </div>
      </section>

      <ul className="h2-promises h2-verbs" aria-label="Ways in">
        {VERBS.map(([t, d, href]) => (
          <li key={t}><Link href={href}><strong>{t}</strong><span>{d}</span></Link></li>
        ))}
      </ul>

      <section className="h2-sec" aria-labelledby="ex-h">
        <div className="h2-head">
          <h2 id="ex-h">Examples for {EXAMPLES.length} kinds of work</h2>
          <p>Trades, wellness, beauty, food, lessons, makers and more, plus clubs and family events. Look around, or start yours from one.</p>
        </div>
        <ul className="h2-examples">
          {featured.map((e) => (
            <li key={e.slug}>
              <Link href={`/examples/${e.slug}`}>
                <MiniSite m={miniData(e)} />
                <strong>{e.name}</strong>
                <span className="h2-ex-blurb">{e.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="h2-allex"><Link href="/examples">See all {EXAMPLES.length} examples&nbsp;→</Link></p>
      </section>

      <section className="h2-sec" aria-labelledby="how-h">
        <div className="h2-head"><h2 id="how-h">How it works</h2></div>
        <ol className="h2-steps h2-steps3">
          {PROCESS.map(([t, d], i) => (
            <li key={t}><span className="h2-num">{i + 1}</span><strong>{t}</strong><p>{d}</p></li>
          ))}
        </ol>
      </section>

      <section className="h2-sec h2-honest" aria-labelledby="honest-h">
        <div>
          <h2 id="honest-h">Straight answers</h2>
          <p className="h2-own">{BRAND_OWNERSHIP}</p>
        </div>
        <div>
          <h3>Good to know</h3>
          <ul>
            <li>You choose where your site lives and pay that company directly, in your own name.</li>
            <li>There&apos;s no account with us to keep up, and nothing to cancel.</li>
            <li>Your draft stays in this browser. Come back any time to keep working on it.</li>
          </ul>
        </div>
      </section>

      <section className="h2-cta" aria-labelledby="cta-h">
        <h2 id="cta-h">Ready when you are.</h2>
        <p>Pick the example closest to your business and make it yours. It&apos;s free to try.</p>
        <div className="h2-go">
          <Link className="h2-btn h2-btn-main" href="/start">Choose your example</Link>
        </div>
        {PAID_HELP_OPEN && (
          <p className="h2-later">
            Rather have us do it? Once you have a draft, you can ask about optional help finishing or publishing it.
            We&apos;ll tell you honestly if it&apos;s a fit. <Link href="/services">About optional help</Link>
          </p>
        )}
      </section>

      <section className="h2-sec" aria-labelledby="more-h">
        <div className="h2-head">
          <h2 id="more-h">More you can make here</h2>
          <p>Guided engines that end with something you can use: a plan, a checklist, messages to send. No account.</p>
        </div>
        <ul className="h2-doors">
          {DOORS.map(([title, text, href]) => (
            <li key={href}>
              <Link href={href}><strong>{title}</strong><span>{text}</span></Link>
            </li>
          ))}
        </ul>
        <p className="h2-allex">
          <Link href="/engines">All engines&nbsp;→</Link>
        </p>
      </section>

      <p className="sh-more">
        Making something other than a website? <Link href="/make">Make it with AI</Link>, or try the{" "}
        <Link href="/tools">tools</Link>. Step In The Ring is run by Open Mirror LLC.
      </p>
    </main>
  );
}
