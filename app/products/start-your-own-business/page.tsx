import type { Metadata } from "next";
import Link from "next/link";
import RingMark from "../../site/RingMark";
import AtAGlance from "../AtAGlance";
import { AVAILABILITY_LABEL, GAME_PLAN, readyMailto } from "../catalog";
import styles from "../products.module.css";

// Start Your Own Business Game Plan (owner direction, Nov 25 2026). The
// workbook itself is private (git-ignored `private/`); this page shows the
// outcome, the steps by name and what a buyer receives. General education,
// never legal, tax or accounting advice. Government steps point to official
// sources only. We never file, buy a domain or open an account for anyone.
// Not on sale until the owner opens sales. No price on this page.
export const metadata: Metadata = {
  title: "Start Your Own Business Game Plan",
  description:
    "A printable Game Plan that takes you from an idea to a small, organized business: your customer, your offer, a name, the official filings, simple records and a first month.",
  alternates: { canonical: "/products/start-your-own-business" },
  openGraph: {
    title: "Start Your Own Business Game Plan | Step In The Ring",
    description: "From an idea to a small, organized business, one step at a time.",
    url: "/products/start-your-own-business",
  },
};

const PRODUCT = "the Start Your Own Business Game Plan";

const steps = [
  ["Say the idea in one sentence", "What it is, who it's for, and why they'd care."],
  ["Pick one customer", "A real person you could describe, and where to find them."],
  ["Decide what you sell", "One product or service, what's included and what isn't."],
  ["Choose a name", "A short list, then the checks: is it taken, can you get the web address."],
  ["Check the web address", "See whether the domain is registered before you fall in love with a name."],
  ["Understand the structures", "Sole proprietor, LLC and the others, in plain words."],
  ["Register with your state", "If you choose an LLC: where your state files it, and what it asks for."],
  ["Get an EIN if you need one", "Who needs one, and where to get it (free, from the IRS)."],
  ["Keep simple records", "A separate account, a folder, and a monthly habit."],
  ["Make a first budget", "What it costs to start, what it costs each month, and your first price."],
  ["Make a simple website", "One page that says what you do and how to reach you."],
  ["Get your first offer ready", "Something a first customer can say yes to."],
  ["Set a weekly routine", "A few hours a week, written down, so it keeps moving."],
];

const included = [
  ["The Game Plan workbook", "Every step above with a short explanation and a worksheet, printable at home."],
  ["Your one-page Game Plan", "The answers that matter on one sheet: keep it where you'll see it."],
  ["Official sources sheet", "Where the IRS, the SBA, the trademark office and your state explain the rules, so you read them from the source."],
  ["Budget sheet", "Start-up costs, monthly costs and a first price, filled in by you."],
  ["Records checklist", "What to keep, where, and a monthly ten-minute review."],
  ["Your first 30 days", "One small task a day for the first month."],
];

const sources = [
  ["IRS: get an employer identification number (EIN)", "https://www.irs.gov/businesses/small-businesses-self-employed/get-an-employer-identification-number"],
  ["IRS: business structures", "https://www.irs.gov/businesses/small-businesses-self-employed/business-structures"],
  ["SBA: launch your business", "https://www.sba.gov/counseling/launch-your-business/"],
  ["USPTO: trademark search", "https://tmsearch.uspto.gov/"],
  ["ICANN: who owns a domain name", "https://lookup.icann.org/"],
];

const faqs = [
  ["Do I need an LLC?", "Not always. Many small businesses start as sole proprietors. The Game Plan lays out the common choices and points you to your state's rules and the IRS, so you can decide, or ask an accountant or attorney."],
  ["Do I need an EIN?", "It depends on how your business is set up and whether you'll have employees. The IRS explains who needs one. Getting an EIN from the IRS is free: never pay another website for one."],
  ["Does it work in my state?", "Yes, for any US state. The filing details differ, and the workbook shows you how to find your own state's official business filing office."],
  ["Is this legal or tax advice?", "No. It's general information and worksheets that help you get organized and ask good questions. For your situation, talk to an attorney or accountant in your state."],
  ["Will you file it for me?", "No. We never file anything, buy a domain or open an account for you. You do each step yourself, from the official source."],
  ["Isn't this information free?", "The official rules are free on the government's own websites, and the Game Plan links to them. What we made is the order to do things in, the worksheets and the plan you fill in."],
];

export default function StartYourOwnBusinessPage() {
  return (
    <main className={styles.page}>
      <Link className="breadcrumb" href="/products">← Ways to make it real</Link>
      <header className={styles.hero}>
        <div>
          <span className="kicker">A Game Plan you keep</span>
          <p className={styles.product}>Start Your Own Business Game Plan</p>
          <h1>
            Start a small business <span>one step at a time.</span>
          </h1>
          <p className={styles.subtitle}>
            A printable workbook that takes you from an idea to a small, organized business: who it&apos;s
            for, what you sell, a name, the official filings, simple records, a first budget, a website and a
            weekly routine.
          </p>
          <div className={styles.actions}>
            <a className="btn btn-gold" href="#steps">See the steps&nbsp;↓</a>
            <a className={styles.textLink} href="#included">What you get ↓</a>
          </div>
          <p className={styles.small}>
            <span className={styles.status} data-a="coming">{AVAILABILITY_LABEL.coming}</span>{" "}
            General information, not legal, tax or accounting advice. Rules differ by state; the Game Plan points
            you to the official sources.
          </p>
        </div>
        <div className={styles.plan} aria-label="A one-page Game Plan with blanks to fill in">
          <h3>My Game Plan</h3>
          {["Business name", "Who it's for", "What I sell", "First price", "Structure", "This week"].map((label) => (
            <div className={styles.planRow} key={label}>
              <span>{label}</span>
              <span aria-hidden="true" />
            </div>
          ))}
          <p className={styles.planFoot}>One page. Keep it where you&apos;ll see it.</p>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="glance-h">
        <div className={styles.intro}>
          <span className="kicker">At a glance</span>
          <h2 id="glance-h">Is this for you?</h2>
        </div>
        <AtAGlance detail={GAME_PLAN.detail!} />
      </section>

      <section id="steps" className={styles.section} aria-labelledby="steps-h">
        <div className={styles.intro}>
          <span className="kicker">The steps</span>
          <h2 id="steps-h">Thirteen steps, from idea to open</h2>
          <p>Some take an evening. Filings take as long as your state takes. Do them in order, or start where you are.</p>
        </div>
        <ol className={styles.steps}>
          {steps.map(([title, line]) => (
            <li key={title}><strong>{title}</strong><span>{line}</span></li>
          ))}
        </ol>
      </section>

      <section id="included" className={styles.section} aria-labelledby="included-h">
        <div className={styles.intro}>
          <span className="kicker">What you get</span>
          <h2 id="included-h">Everything in the Game Plan</h2>
        </div>
        <ul className={styles.grid}>
          {included.map(([title, line]) => (
            <li key={title} className={styles.card}>
              <h3>{title}</h3>
              <p>{line}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="honest-h">
        <div className={styles.intro}>
          <span className="kicker">What we will and won&apos;t do</span>
          <h2 id="honest-h">You stay in charge of your business.</h2>
        </div>
        <div className={styles.split}>
          <div className={styles.panel}>
            <h3>We will</h3>
            <ul className={styles.checks}>
              <li>Explain each step in plain words</li>
              <li>Point you to the official source for every government step</li>
              <li>Give you worksheets that turn answers into a plan</li>
            </ul>
          </div>
          <div className={styles.panel}>
            <h3>We won&apos;t</h3>
            <ul className={`${styles.checks} ${styles.nots}`}>
              <li>File anything, buy a domain or open an account for you</li>
              <li>Give legal, tax or accounting advice</li>
              <li>Promise income. A business takes work and time</li>
            </ul>
          </div>
        </div>
        <p className={styles.small} style={{ marginTop: 18 }}>
          Step In The Ring is run by Open Mirror LLC, a small company that went through these same steps in 2026.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="sources-h">
        <div className={styles.intro}>
          <span className="kicker">Read it from the source</span>
          <h2 id="sources-h">A few of the official pages the Game Plan uses</h2>
          <p>For your state&apos;s filings, search for your state&apos;s secretary of state business filing office and make sure the address ends in .gov.</p>
        </div>
        <ul className={styles.checks}>
          {sources.map(([label, href]) => (
            <li key={href}><a href={href} rel="noopener noreferrer" target="_blank">{label}</a></li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-h">
        <div className={styles.intro}>
          <span className="kicker">A few fair questions</span>
          <h2 id="faq-h">Before you start</h2>
        </div>
        <div className={styles.faq}>
          {faqs.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="close-h">
        <RingMark />
        <span className={styles.status} data-a="coming">{AVAILABILITY_LABEL.coming}</span>
        <h2 id="close-h">Have an idea for a business?</h2>
        <p>Start with one sentence: what it is and who it&apos;s for. The free tools can help today.</p>
        <Link className="btn btn-gold btn-big" href="/engines">Try the free engines&nbsp;→</Link>
        <p className={styles.small}>
          Want to hear when the Game Plan is ready? <a href={readyMailto(PRODUCT)}>Email us</a>.
        </p>
      </section>
    </main>
  );
}
