import type { Metadata } from "next";
import Link from "next/link";
import { Band, Masthead, Sheet } from "../site/ui";
import { CARE_PLANS, CARE_TERMS, NOT_INCLUDED, OFFERS } from "./offers";

export const metadata: Metadata = {
  title: "Services: websites and web apps, built with you",
  description:
    "Website reviews, starter and business websites, and custom web apps for people and small businesses. A written quote before any work starts.",
};

const STEPS = [
  ["Tell us about it", "Send a short request. We reply by email, usually within two business days."],
  ["Get a written quote", "What we'll build, what's not included, the schedule and a fixed price."],
  ["Approve and start", "Work begins after you approve the quote and pay a 50% deposit."],
  ["Preview and change", "You click through a private preview and send changes, within the rounds included."],
  ["Accept and launch", "When you're happy, the other 50% is due, and the site goes live in your name."],
] as const;

export default function ServicesPage() {
  return (
    <Sheet wide>
      <Masthead
        kicker="Build it with us"
        title="Have an idea? Let's build it."
        lead="Websites and web apps for people, small businesses and organizations. Planned with you, built carefully, tested on real phones, and handed over so you own it."
      >
        <div className="svc-mast-go">
          <Link className="btn btn-gold" href="/request">Request a project</Link>
          <Link className="text-link" href="/builds">See our work&nbsp; →</Link>
        </div>
      </Masthead>

      <section className="svc-who" aria-labelledby="who-heading">
        <h2 id="who-heading">Who you&apos;re working with</h2>
        <p>
          Decades of experience in operations, technology and digital product management, including
          leading the teams that build and ship software. Modern development tools help us move
          quickly. You get plain answers, a written scope, a fixed price, and one person who answers
          your email.
        </p>
      </section>

      <Band title="Services" note="Introductory prices. Every project starts with a written quote, and the quote is the final word.">
        <div className="svc-grid">
          {OFFERS.map((o) => (
            <article key={o.id} id={o.id} className={o.flagship ? "svc-card svc-flagship" : "svc-card"} aria-labelledby={`${o.id}-name`}>
              {o.flagship ? <span className="svc-badge">Best fit for most businesses</span> : null}
              <h3 id={`${o.id}-name`}>{o.name}</h3>
              <p className="svc-price">{o.price.startsWith("Starting at ") ? <><small>Starting at</small> {o.price.slice(12)}</> : o.price}</p>
              <p className="svc-for">{o.forWho}</p>
              <ul>
                {o.includes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="svc-time">{o.timing}</p>
              <a className={o.flagship ? "btn btn-gold" : "btn btn-ghost"} href={`/request#${o.id}`}>
                Ask about this
              </a>
            </article>
          ))}
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
          Larger projects can be paid in milestones instead. Changes outside the written scope are
          quoted first, and start only when you say yes.
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
          <span className="kicker">Build it yourself</span>
          <h2 id="diy-heading">Rather make it on your own?</h2>
          <p>
            The workspace, tools and engines here are free to use with no account. Say what you want
            to make, and work with an AI app until it&apos;s right.
          </p>
        </div>
        <Link className="btn btn-ghost" href="/create">Start on your own</Link>
      </section>

      <section className="svc-final" aria-labelledby="final-heading">
        <h2 id="final-heading">Tell us what you have in mind.</h2>
        <p>A few sentences is enough. We&apos;ll reply with questions or a quote.</p>
        <Link className="btn btn-gold btn-big" href="/request">Request a project</Link>
      </section>

    </Sheet>
  );
}
