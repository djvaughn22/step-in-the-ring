import type { Metadata } from "next";
import Link from "next/link";
import { Band, Masthead, Sheet } from "../site/ui";
import { CARE_PLANS, CARE_TERMS, FINISH_VS_BUSINESS, NOT_INCLUDED, OFFERS, PRICE_RANGE } from "./offers";
import { FREE_LINE } from "../starter/copy";
import { EXAMPLES } from "../starter/examples";

const EXAMPLE_COUNT = EXAMPLES.length;

export const metadata: Metadata = {
  title: "Services: help with your website",
  description:
    `Optional help for small service businesses: publish the draft you made, have it finished, or have a site built, ${PRICE_RANGE}. A written quote comes before any work starts.`,
};

const STEPS = [
  ["Tell us about it", "Send a short request. We reply by email, usually within two business days."],
  ["Get a written quote", "What we'll build, what's not included, the schedule and a fixed price."],
  ["Approve and start", "Work begins only after you approve the written quote. How and when you pay is set out in it."],
  ["Preview and change", "You click through a private preview and send changes, within the rounds included."],
  ["Accept and launch", "When you're happy, the site goes live in your name, with the hosting you chose."],
] as const;

export default function ServicesPage() {
  return (
    <Sheet wide>
      <Masthead
        kicker="Optional help"
        title="Help with your website, when you want it."
        lead="Make your site with the website starter on your own, or have us publish it, finish it, or build it with you."
      >
        <div className="svc-freepaid">
          <p><strong>Free:</strong> {FREE_LINE}</p>
          <p><strong>Paid, if you want it:</strong> the services below. Every one starts as a request and a written quote, and nothing is sold or charged on this site.</p>
        </div>
        <div className="svc-mast-go">
          <Link className="btn btn-gold" href="/request">Request a project</Link>
          <Link className="text-link" href="/start">Or start your own website&nbsp; →</Link>
        </div>
      </Masthead>

      <Band title="Services" note={`Introductory prices, ${PRICE_RANGE}. Every project starts with a written quote, and the quote is the final word.`}>
        <div className="svc-grid">
          {OFFERS.map((o) => (
            <article key={o.id} id={o.id} className={o.flagship ? "svc-card svc-flagship" : "svc-card"} aria-labelledby={`${o.id}-name`}>
              <h3 id={`${o.id}-name`}>{o.name}</h3>
              <p className="svc-price">{o.price.startsWith("Starting at ") ? <><small>Starting at</small> {o.price.slice(12)}</> : o.price}</p>
              <p className="svc-for">{o.forWho}</p>
              <ul>
                {o.includes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="svc-bound"><strong>Where it stops:</strong> {o.boundary}</p>
              <p className="svc-time">{o.timing}</p>
              <a className={o.flagship ? "btn btn-gold" : "btn btn-ghost"} href={`/request#${o.id}`}>
                Ask about this
              </a>
            </article>
          ))}
        </div>
      </Band>

      <Band title="Finish my draft or Small business site?" note="The quickest way to tell: did you already make a draft here?">
        <div className="svc-compare-wrap">
          <table className="svc-compare">
            <thead>
              <tr><th scope="col"><span className="sr-only">Compare</span></th><th scope="col">Finish my draft</th><th scope="col">Small business site</th></tr>
            </thead>
            <tbody>
              {FINISH_VS_BUSINESS.map((r) => (
                <tr key={r.label}><th scope="row">{r.label}</th><td>{r.finish}</td><td>{r.business}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Band>

      <Band title="How it works" note="Nothing is booked or charged until you approve a written quote.">
        <ol className="svc-steps">
          {STEPS.map(([t, d], i) => (
            <li key={t}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{t}</strong>
              <p>{d}</p>
            </li>
          ))}
        </ol>
        <p className="svc-note">
          Changes outside the written scope are quoted first, and start only when you say yes.
        </p>
      </Band>

      <div className="svc-split">
        <Band title="Not included in any package">
          <ul className="svc-list">
            {NOT_INCLUDED.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Band>
        <Band title="Care after launch" note="Optional. Offered once your site is live, by conversation. There's nothing to sign up for here.">
          <ul className="svc-care">
            {CARE_PLANS.map((c) => (
              <li key={c.name}>
                <strong>{c.name}</strong> <span className="svc-care-price">{c.price}</span>
                <p>{c.includes}</p>
              </li>
            ))}
          </ul>
          <p className="svc-note">{CARE_TERMS}</p>
        </Band>
      </div>

      <section className="svc-diy" aria-labelledby="diy-heading">
        <div>
          <span className="kicker">Do it yourself</span>
          <h2 id="diy-heading">Rather make it on your own?</h2>
          <p>
            The website starter is free. It has examples for {EXAMPLE_COUNT} kinds of business: add your
            details, make it yours, and download the files. No account needed.
          </p>
        </div>
        <Link className="btn btn-ghost" href="/start">Choose an example</Link>
      </section>

      <section className="svc-final" aria-labelledby="final-heading">
        <h2 id="final-heading">Tell us what you have in mind.</h2>
        <p>A few sentences is enough. We&apos;ll reply with questions or a quote.</p>
        <Link className="btn btn-gold btn-big" href="/request">Request a project</Link>
      </section>

    </Sheet>
  );
}
