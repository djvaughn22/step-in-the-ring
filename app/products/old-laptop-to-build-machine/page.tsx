import type { Metadata } from "next";
import Link from "next/link";
import RingMark from "../../site/RingMark";
import AtAGlance from "../AtAGlance";
import { AVAILABILITY_LABEL, OLD_LAPTOP, readyMailto } from "../catalog";
import styles from "../products.module.css";

// Old Laptop to Build Machine (recovered Nov 26 2026; the guide bundle itself
// is private and never served from this repo). This page shows the outcome
// and says what a buyer receives. It does not give the guide away: the free
// readiness check is /build-machine, and the steps below are titles only.
// Not on sale until the owner opens sales. No price on this page.
export const metadata: Metadata = {
  title: "Old Laptop to Build Machine",
  description:
    "A step-by-step guide for turning a suitable older laptop or desktop into a machine for making websites and apps, ending with a first project online.",
  alternates: { canonical: "/products/old-laptop-to-build-machine" },
  openGraph: {
    title: "Old Laptop to Build Machine | Step In The Ring",
    description: "Your old computer can still build things. A guide you keep.",
    url: "/products/old-laptop-to-build-machine",
  },
};

const PRODUCT = "Old Laptop to Build Machine";

const finishLine = [
  "A clean, supported system (Linux Mint) on the computer you already own",
  "A code editor, Git, GitHub and Node.js, installed and checked",
  "Your first project online, with a real link you can share",
  "A simple routine for the next thing you make",
];

const included = [
  ["The illustrated guide", "Every step with pictures, as a printable PDF and a web version."],
  ["Readiness worksheet", "Write down what your computer has and decide if it's a good candidate."],
  ["Master checklist", "One printable page that keeps your place from start to finish."],
  ["Terminal reference card", "The handful of commands you'll actually use, in plain words."],
  ["Git and GitHub reference card", "Save your work, go back when something breaks, put it online."],
  ["Troubleshooting and recovery guide", "What to do when the install, the Wi-Fi or a tool doesn't cooperate."],
  ["Careful setup script", "Shows its plan and asks before it changes anything. A second script only checks, and changes nothing."],
  ["Your first project, finished", "A small working website to start from, so your first live link isn't a blank page."],
];

const path = [
  ["Check the computer", "Is it a good candidate? Find out before you change anything."],
  ["Back up", "Copy what matters off the machine, and check that the copy works."],
  ["Install Linux Mint", "A guided install, with the erase step called out plainly."],
  ["Set up the tools", "Editor, Git, GitHub and Node.js, the safe way."],
  ["Run the check", "Confirm every tool works before you build on it."],
  ["Make the first project", "Change it, test it on a phone, and put it online."],
  ["Keep building", "A routine for the next idea, one small step at a time."],
];

const goodFit = [
  "Laptops and desktops with a 64-bit Intel or AMD processor",
  "Mini PCs and small desktops that still power on",
  "A working USB port and enough free storage",
  "An evening or two, and patience for a slow old machine",
];

const notAFit = [
  "Apple computers, Chromebooks and tablets",
  "Computers your work or school manages",
  "Any computer whose files you haven't backed up yet",
  "Anyone hoping for a business in a day: this gets you a working setup and a first project",
];

const faqs = [
  ["Will it erase my computer?", "It can. Installing replaces what's on the drive you choose. The guide starts with a backup, and asks you to confirm before the step that erases anything."],
  ["Do I need to know Linux or how to code?", "No. Every step says what to click or type and what you should see. You learn the few commands you need as you go."],
  ["How is this different from the free Build Machine page?", "The free page checks your computer and lists the steps. The guide walks through every step with pictures, the setup and check scripts, the reference cards, the recovery guide and the finished first project."],
  ["Does it cost anything to run?", "The tools in the guide cost nothing. Outside services you might choose later, like a coding AI app or your own domain name, have their own costs."],
  ["Can every old computer do this?", "No. Age alone doesn't decide it; the processor, memory, storage and condition do. That's why the first step is the free check."],
  ["Do I have to pay for Linux or the tools?", "No. Linux Mint, VS Code, Git, GitHub's free plan and Node.js are made by others and free to use under their own licenses. What the guide adds is ours: the steps in order, the worksheets, the scripts and the first project."],
];

export default function OldLaptopPage() {
  return (
    <main className={styles.page}>
      <Link className="breadcrumb" href="/products">← Ways to make it real</Link>
      <header className={styles.hero}>
        <div>
          <span className="kicker">A guide you keep</span>
          <p className={styles.product}>{PRODUCT}</p>
          <h1>
            Your old computer <span>can still build things.</span>
          </h1>
          <p className={styles.subtitle}>
            A step-by-step guide for turning a suitable older laptop or desktop into a machine for making
            websites and apps, then putting your first project online.
          </p>
          <div className={styles.actions}>
            <Link className="btn btn-gold" href="/build-machine">
              Check my computer, free&nbsp;→
            </Link>
            <a className={styles.textLink} href="#included">What you get ↓</a>
          </div>
          <p className={styles.small}>
            <span className={styles.status} data-a="coming">{AVAILABILITY_LABEL.coming}</span>{" "}
            Not every old computer can do this. The free check tells you before you change anything.
          </p>
        </div>
        <div className={styles.visual} aria-label="An unused laptop becomes a laptop running a first project">
          <span className={styles.visualLabel}>SAME COMPUTER</span>
          <div className={styles.laptops}>
            <div className={styles.laptop}>
              <div className={styles.screen}><span className={styles.off}>UNUSED</span></div>
              <div className={styles.base} />
            </div>
            <span className={styles.arrow} aria-hidden="true">→</span>
            <div className={styles.laptop}>
              <div className={styles.screen}>
                <div className={styles.mini}>
                  <b>My Build Log</b>
                  <i /><i /><i /><i />
                </div>
              </div>
              <div className={styles.base} />
            </div>
          </div>
          <p className={styles.visualFoot}>
            <strong>From the drawer to a first live project.</strong>
            The finish line: real tools, and a website of your own online.
          </p>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="glance-h">
        <div className={styles.intro}>
          <span className="kicker">At a glance</span>
          <h2 id="glance-h">Is this for you?</h2>
        </div>
        <AtAGlance detail={OLD_LAPTOP.detail!} />
      </section>

      <section className={styles.section} aria-labelledby="finish-h">
        <div className={styles.intro}>
          <span className="kicker">Where you end up</span>
          <h2 id="finish-h">At the end of the guide, you have:</h2>
        </div>
        <ul className={styles.checks}>
          {finishLine.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>

      <section id="included" className={styles.section} aria-labelledby="included-h">
        <div className={styles.intro}>
          <span className="kicker">What you get</span>
          <h2 id="included-h">Everything in the guide</h2>
          <p>One download. It opens on Windows, Mac, Linux, phones and tablets, so you can read it on one screen while you work on the other.</p>
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

      <section className={styles.section} aria-labelledby="path-h">
        <div className={styles.intro}>
          <span className="kicker">The path</span>
          <h2 id="path-h">Seven steps, in order</h2>
          <p>Each step ends with a check, so you always know it worked before you move on.</p>
        </div>
        <ol className={styles.steps}>
          {path.map(([title, line]) => (
            <li key={title}><strong>{title}</strong><span>{line}</span></li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="fit-h">
        <div className={styles.intro}>
          <span className="kicker">Honest about it</span>
          <h2 id="fit-h">Is your computer a good fit?</h2>
        </div>
        <div className={styles.split}>
          <div className={styles.panel}>
            <h3>Good fit</h3>
            <ul className={styles.checks}>{goodFit.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
          <div className={styles.panel}>
            <h3>Not a fit</h3>
            <ul className={`${styles.checks} ${styles.nots}`}>{notAFit.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        </div>
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
        <h2 id="close-h">Start with the free check today.</h2>
        <p>Find out what your computer can become before you spend anything.</p>
        <Link className="btn btn-gold btn-big" href="/build-machine">Check my computer&nbsp;→</Link>
        <p className={styles.small}>
          Want to hear when the guide is ready? <a href={readyMailto(PRODUCT)}>Email us</a>.
        </p>
      </section>
    </main>
  );
}
