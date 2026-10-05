import type { Metadata } from "next";
import Link from "next/link";
import RingMark from "../../site/RingMark";
import ComputerCheck from "./ComputerCheck";
import RealProjects from "./RealProjects";
import styles from "./ready.module.css";

export const metadata: Metadata = {
  title: "Ready to Build",
  description: "A free guide for the computer you already have: check it, protect your files, set it up, and get to your first simple live project.",
  alternates: { canonical: "/products/ready-to-build" },
  openGraph: {
    title: "Ready to Build | Step In The Ring",
    description: "Your computer. Your idea. Your first live project. A free, step-by-step guide.",
    url: "/products/ready-to-build",
  },
};

const steps = [
  ["Check it", "Find out what computer you have, what operating system it uses, how much memory and storage it has, and whether it is a good candidate."],
  ["Protect it", "Back up anything important before wiping, reinstalling, or changing the machine."],
  ["Rebuild it", "Clean up the existing system or install a better-supported setup when that makes sense."],
  ["Prepare it", "Install the workspace and tools used in the Step In The Ring process."],
  ["Build it", "Bring an idea, work with an AI coding agent, test the result, and improve it."],
  ["Go live", "Publish the project and receive a real link you can share."],
];
// The free path: every item is a real page on this site that works today.
const kit = [
  { title: "Understand and protect your computer", items: [
    ["Answer the computer check above", "#computer-check"],
    ["Back up, then assess the machine with the Build Machine guide", "/build-machine"],
  ] },
  { title: "Prepare your workspace", items: [
    ["Install the one supported Linux setup, step by step", "/build-machine"],
    ["Read the software playbook: editor, Git, GitHub, AI assistant, deploys", "/how"],
  ] },
  { title: "Make your first project real", items: [
    ["Follow the first build in six short rounds", "/build"],
    ["Cut your idea down to a first version you can finish", "/tools/first-version"],
    ["Run the launch checklist before you share the link", "/tools/launch-checklist"],
  ] },
];
const examples = [
  ["Personal website", "A home for your work, your story, and a way to reach you."],
  ["Family or community tool", "A shared resource page or a simple activity planner."],
  ["Sports desk", "Your team’s schedule, useful links, and game-day notes."],
  ["Small-business website", "Your services, opening hours, and contact details in one place."],
  ["Hobby project", "A garden journal, a collection, or a guide to something you love."],
  ["Tracker, dashboard, or simple web app", "Start with a personal habit tracker or a small dashboard using sample data."],
];
const faqs = [
  ["Do I need a new computer?", "Start with the computer you already own. The readiness checklist helps you decide whether it can run a supported operating system and the tools you need before you buy anything."],
  ["What if my computer is old?", "Age alone does not decide it. Storage, memory, condition, and operating-system support matter. Back up important files before making changes. Some machines benefit from a cleanup or an affordable upgrade; others are not worth rebuilding. The guide helps you make that call."],
  ["Do I need to know how to code?", "No prior coding experience is required to start. You will describe what you want in plain language and learn to inspect, test, and change the result. AI is in your corner; you still make the decisions. Kids should build with a parent."],
  ["Can I use Windows, Mac, or Linux?", "The computer check above covers all three. The step-by-step Build Machine guide uses one supported Linux setup; on Windows or Mac you can install the same tools (a code editor, Git, Node.js) from their official pages. Your machine must support a suitable operating system and the tools you choose. You do not need to run an AI model on the computer itself."],
  ["What can I realistically build in one day?", "Aim for one simple project: a personal site, a small resource page, or a basic tracker. Computer repairs, a slow setup, or learning a new tool can take longer. Larger apps, accounts, payments, and sensitive data need more design, testing, and iteration."],
  ["Is this the same as blindly accepting AI-generated code?", "No. Work in small steps. Ask the agent to explain changes, review them, test the page on a phone and a computer, and keep a recoverable copy in Git. Check that private information and credentials stay out of your published project. A confident AI answer is not a passing test."],
  ["Does any of this cost money?", "No. The guide and the tools on this site are free and need no account. Outside services you might choose, such as an AI assistant, hosting, or a domain name, can have separate costs of their own. Check each provider's terms before you sign up."],
];

export default function ReadyToBuildPage() {
  return (
    <main className={styles.page}>
      <Link className="breadcrumb" href="/tools">← Free tools</Link>
      <header className={styles.hero}>
        <div>
          <span className="kicker">Have an old computer?</span>
          <p className={styles.product}>Ready to Build</p>
          <h1>Before you buy a new one, <span>find out what yours can become.</span></h1>
          <p className={styles.subtitle}>That computer sitting in a closet—or running slowly on your desk—may be enough to become your personal AI build machine. Ready to Build walks you through the decision safely: check the computer, protect or remove the old setup, rebuild it if needed, install the right tools, and create your first live project.</p>
          <p>An AI build machine is simply a computer set up to make websites and apps with an AI coding assistant. Back up first, then decide what to keep or remove.</p>
          <div className={styles.actions}><a className="btn btn-gold" href="#computer-check">Check my computer <span aria-hidden="true">→</span></a><a className={styles.textLink} href="#process">See the whole process ↓</a></div>
          <p className={styles.small}>A first simple live project in a day is a goal, not a guarantee. Repairs, setup, and larger ideas can take longer.</p>
        </div>
        <div className={styles.workbench} aria-label="Illustration of a first project, from computer to live website">
          <div className={styles.workbenchTop}><RingMark /><span>YOUR NEXT CHAPTER<br /><strong>Starts on your desk.</strong></span></div>
          <div className={styles.computer}><div className={styles.screen}><span className={styles.screenLabel}>MY FIRST PROJECT / PREVIEW</span><div className={styles.preview}><span className={styles.previewMark} aria-hidden="true">↗</span><strong>Hello, world.<br />I made this.</strong><p>A small idea.<br />A place on the internet.</p><span className={styles.previewButton}>Ready to share</span></div></div><div className={styles.keyboard} /></div>
          <div className={styles.workbenchBottom}><strong>Your first live project starts with the computer you already have.</strong></div>
          <p className={styles.small}>An example of your first finish line.</p>
        </div>
      </header>

      <section id="process" className={styles.section} aria-labelledby="process-heading">
        <div className={styles.sectionIntro}>
          <span className="kicker">Check first. Build from there.</span>
          <h2 id="process-heading">What this page is for</h2>
          <p>This is not a promise that every old computer can do everything. It is a guided starting point for finding out what is possible with the machine you already own.</p>
        </div>
        <ol className={styles.journey} aria-label="Your path to a live project">
          {steps.map(([title, copy], i) => <li key={title}><span className={styles.number}>0{i + 1}</span><h3>{title}</h3><p>{copy}</p></li>)}
        </ol>
      </section>

      <ComputerCheck />

      <RealProjects />

      <section id="included" className={styles.section} aria-labelledby="kit-heading"><div className={styles.sectionIntro}><span className="kicker">The free path</span><h2 id="kit-heading">What you will get help with</h2><p>Everything below is a free page on this site that works today. Do them in order, or jump to the one you need. No account, no download, nothing to buy.</p></div><div className={styles.threeColumns}>{kit.map(group => <article className={styles.kitCard} key={group.title}><h3>{group.title}</h3><ul>{group.items.map(([label, href]) => <li key={label}>{href.startsWith("#") ? <a href={href}>{label}</a> : <Link href={href}>{label}</Link>}</li>)}</ul></article>)}</div><div className={styles.note}><strong>One prompt starts the work. You stay in charge.</strong><p>Review, test, and approve what goes live. Then improve what you made, one small rep at a time.</p></div></section>

      <section className={styles.section} aria-labelledby="examples-heading"><div className={styles.sectionIntro}><span className="kicker">What you can build</span><h2 id="examples-heading">Start with something that matters to you.</h2><p>Learn a process you can repeat, not just instructions for copying one project. Keep the first version small enough to finish.</p></div><div className={styles.examples}>{examples.map(([title, copy], i) => <article key={title}><span className={styles.number}>0{i + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

      <section className={styles.section} aria-labelledby="faq-heading"><div className={styles.sectionIntro}><span className="kicker">A few fair questions</span><h2 id="faq-heading">Before you step in.</h2></div><div className={styles.faq}>{faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>

      <section className={styles.closing}><RingMark /><span className="kicker">Ready when you are</span><h2>Take the computer you already have.<br />Bring the idea you keep putting off.<br /><span>Step in and build it.</span></h2><a className="btn btn-gold btn-big" href="#computer-check">Check my computer →</a></section>
    </main>
  );
}
