import Link from "next/link";
import "./starter.css";
import "./home2.css";
import { BRAND_OWNERSHIP } from "../site/brand";
import { OFFERS, NOT_INCLUDED, PRICE_RANGE } from "../services/offers";
import ArrivalForward from "./ArrivalForward";
import DevicePreview from "./DevicePreview";
import { draftFromExample, paletteById } from "./draft";
import { EXAMPLES, exampleBySlug } from "./examples";
import { renderSite } from "./render";

// THE FRONT DOOR (overnight brief, 2026-11-12): a website service for small
// businesses first, the do-it-yourself starter second. Prices come only from
// app/services/offers.ts. No invented clients, numbers or promises.

const SHOWCASE = "mobile-dog-groomer";
const FEATURED = ["handyman", "hair-stylist-barber", "house-cleaner", "personal-trainer", "photographer", "bookkeeper"];

const PROMISES = [
  ["A written quote first", "You see the scope, price and timing in writing before any work or payment."],
  ["Yours, in your name", "Your domain and hosting are in your name. You keep the files."],
  ["Checked on real screens", "Every page is tried on a phone and a computer before it goes live."],
] as const;

const PROCESS = [
  ["Tell us about it", "A short form: your business, what you need, and when. No account."],
  ["Get a written quote", "What's included, what isn't, the price and the timing."],
  ["See it as it's built", "You review a preview and ask for changes."],
  ["Go live", "We help connect your domain and hosting, then hand everything over."],
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
          <p className="h2-kicker">Websites for small businesses</p>
          <h1>Get your business online. <span>Without the headache.</span></h1>
          <p className="h2-lead">
            We build clear websites for solo owners and small businesses, from putting a page you made online to a
            full site that does more. Projects run {PRICE_RANGE}, and you get a written quote before anything starts.
          </p>
          <div className="h2-go">
            <Link className="h2-btn h2-btn-main" href="/request">Tell us about your project</Link>
            <Link className="h2-btn h2-btn-alt" href="/services">See services and prices</Link>
          </div>
          <p className="h2-diy">
            Rather do it yourself? <Link href="/start">Make your own site with the website starter</Link>. It&apos;s free, with no account.
          </p>
        </div>
        <div className="sh-show h2-show" aria-label={`Example: ${ex.name.toLowerCase()}`}>
          <div className="sh-show-desk"><DevicePreview html={html} title={`Example website for a ${ex.name.toLowerCase()}, desktop`} initial="desktop" hideToggle /></div>
          <div className="sh-show-phone"><DevicePreview html={html} title={`Example website for a ${ex.name.toLowerCase()}, phone`} initial="phone" hideToggle /></div>
          <Link className="sh-show-cap" href={`/examples/${ex.slug}`}>Example: {ex.name.toLowerCase()}&nbsp;→</Link>
        </div>
      </section>

      <ul className="h2-promises" aria-label="How we work">
        {PROMISES.map(([t, d]) => (
          <li key={t}><strong>{t}</strong><span>{d}</span></li>
        ))}
      </ul>

      <section className="h2-sec" aria-labelledby="offers-h">
        <div className="h2-head">
          <h2 id="offers-h">Pick how much help you want</h2>
          <p>Introductory prices. The written quote is the final word, and nothing is charged on this site.</p>
        </div>
        <ul className="h2-offers">
          {OFFERS.map((o) => (
            <li key={o.id} className="h2-offer">
              <span className="h2-price">{o.price}</span>
              <h3>{o.name}</h3>
              <p>{o.forWho}</p>
              <ul>{o.includes.slice(0, 3).map((i) => <li key={i}>{i}</li>)}</ul>
              <Link className="h2-more" href={`/services#${o.id}`} aria-label={`More about ${o.name}`}>What&apos;s included&nbsp;→</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="h2-sec" aria-labelledby="ex-h">
        <div className="h2-head">
          <h2 id="ex-h">Example sites for {EXAMPLES.length} kinds of business</h2>
          <p>Each one is written for that kind of work. Look around, or start your own from one.</p>
        </div>
        <ul className="h2-examples">
          {featured.map((e) => {
            const p = paletteById(e.palette);
            return (
              <li key={e.slug}>
                <Link href={`/examples/${e.slug}`}>
                  <span className="h2-ex-swatch" aria-hidden="true" style={{ background: p.bg }}>
                    <i style={{ background: e.accent }} /><i style={{ background: p.alt }} /><i style={{ background: p.text }} />
                  </span>
                  <strong>{e.name}</strong>
                  <span>{e.blurb}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="h2-allex"><Link href="/examples">See all {EXAMPLES.length} examples&nbsp;→</Link></p>
      </section>

      <section className="h2-sec" aria-labelledby="how-h">
        <div className="h2-head"><h2 id="how-h">How a project goes</h2></div>
        <ol className="h2-steps">
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
          <h3>Not part of any package</h3>
          <ul>{NOT_INCLUDED.slice(0, 4).map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      </section>

      <section className="h2-cta" aria-labelledby="cta-h">
        <h2 id="cta-h">Ready when you are.</h2>
        <p>Tell us what you need. You&apos;ll get a written quote, and there&apos;s no obligation to go ahead.</p>
        <div className="h2-go">
          <Link className="h2-btn h2-btn-main" href="/request">Tell us about your project</Link>
          <Link className="h2-btn h2-btn-alt" href="/start">Choose your example</Link>
        </div>
      </section>

      <p className="sh-more">
        Making something other than a business website? <Link href="/make">Make it with AI</Link>, or try the{" "}
        <Link href="/tools">tools</Link> and <Link href="/engines">engines</Link>. Step In The Ring is run by Open Mirror LLC.
      </p>
    </main>
  );
}
