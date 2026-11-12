import Link from "next/link";
import "./starter.css";
import RingMark from "../site/RingMark";
import { BRAND_OWNERSHIP, BRAND_SIGNATURE } from "../site/brand";
import { OFFERS } from "../services/offers";
import ArrivalForward from "./ArrivalForward";
import { PAID_LINE } from "./copy";
import DevicePreview from "./DevicePreview";
import { draftFromExample } from "./draft";
import { EXAMPLES, exampleBySlug } from "./examples";
import { renderSite } from "./render";

// THE FRONT DOOR (2026-11-11): the website starter. Kept short on purpose:
// what you get, how it goes, the examples, the hosting difference, and help.

const SHOWCASE = "mobile-dog-groomer";

const STEPS = [
  ["Choose an example", "Pick the business closest to yours. Each one has sections and wording written for that kind of work."],
  ["Add your details and make it yours", "Your name, area and contact details first. Then change the words, colors, fonts, photos and sections, and check it on a phone and a computer."],
  ["Download your files", "Free. One download with your page, your photos and a short guide to putting it online with the hosting you choose."],
] as const;

export default function StarterHome() {
  const ex = exampleBySlug(SHOWCASE) ?? EXAMPLES[0];
  const html = renderSite(draftFromExample(ex), { mode: "preview" });

  return (
    <main className="sh">
      <ArrivalForward />
      <section className="sh-hero">
        <div className="sh-hero-copy">
          <div className="sh-sig"><RingMark /><span>Step In The Ring<span>{BRAND_SIGNATURE}</span></span></div>
          <h1>A clear website for your business. <span>Yours to keep.</span></h1>
          <p className="sh-lead">
            Start from an example written for your kind of work, add your details, and change it until it
            looks right. Then download the files. It&apos;s free, with no coding and no account.
          </p>
          <div className="sh-go">
            <Link className="btn btn-gold btn-big" href="/start">Choose your example</Link>
            <Link className="text-link" href="/examples">See all {EXAMPLES.length} examples&nbsp;→</Link>
          </div>
          <div className="sh-freepaid">
            <p><strong>Free</strong>Make your website yourself and download it. No account.</p>
            <p><strong>Optional paid help</strong>Or ask us to finish and publish it, by written quote.</p>
          </div>
          <p className="sh-own">{BRAND_OWNERSHIP}</p>
        </div>
        <div className="sh-show" aria-label={`Example: ${ex.name.toLowerCase()}`}>
          <div className="sh-show-desk"><DevicePreview html={html} title={`Example website for a ${ex.name.toLowerCase()}, desktop`} initial="desktop" hideToggle /></div>
          <div className="sh-show-phone"><DevicePreview html={html} title={`Example website for a ${ex.name.toLowerCase()}, phone`} initial="phone" hideToggle /></div>
          <Link className="sh-show-cap" href={`/examples/${ex.slug}`}>Example: {ex.name.toLowerCase()}&nbsp;→</Link>
        </div>
      </section>

      <section className="sh-how" aria-labelledby="how-h">
        <h2 id="how-h">How it works</h2>
        <ol>
          {STEPS.map(([t, d], i) => (
            <li key={t}>
              <span className="sh-num">{i + 1}</span>
              <strong>{t}</strong>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="sh-ex" aria-labelledby="ex-h">
        <div className="sh-ex-head">
          <h2 id="ex-h">Examples for {EXAMPLES.length} kinds of business</h2>
          <p>Local, home-based, appointment-based and mobile work. Pick one to see it.</p>
        </div>
        <ul className="sh-chips">
          {EXAMPLES.map((e) => (
            <li key={e.slug}><Link href={`/examples/${e.slug}`}>{e.name}</Link></li>
          ))}
        </ul>
      </section>

      <section className="sh-own-band" aria-labelledby="own-h">
        <h2 id="own-h">Your site, your hosting</h2>
        <ul>
          <li><strong>You own the files.</strong> The download is a normal website: one page, your photos, and a README. Keep it, copy it, change it.</li>
          <li><strong>We don&apos;t host it.</strong> You choose where it lives and pay that company directly, in your name. There&apos;s no account with us to keep up.</li>
          <li><strong>Help when you want it.</strong> We can connect your domain and the hosting you choose, or finish the site for you. A written quote comes first.</li>
        </ul>
      </section>

      <section className="sh-help" aria-labelledby="help-h">
        <div>
          <span className="kicker">Optional paid help</span>
          <h2 id="help-h">Rather have us do it?</h2>
          <p>{PAID_LINE} It covers anything from publishing the draft you made to building the whole site.</p>
          <div className="sh-help-go">
            <Link className="btn btn-ghost" href="/services">See services</Link>
            <Link className="text-link" href="/builds">See what we&apos;ve made&nbsp;→</Link>
          </div>
        </div>
        <ul className="sh-offers">
          {OFFERS.map((o) => (
            <li key={o.id}><Link href={`/services#${o.id}`}><strong>{o.name}</strong><span>{o.price}</span></Link></li>
          ))}
        </ul>
      </section>

      <p className="sh-more">
        Making something other than a business website? <Link href="/make">Make it with AI</Link>, or try the{" "}
        <Link href="/tools">tools</Link> and <Link href="/engines">engines</Link>.
      </p>
    </main>
  );
}
