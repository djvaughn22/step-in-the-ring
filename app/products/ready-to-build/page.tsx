import type { Metadata } from "next";
import Link from "next/link";
import RingMark from "../../site/RingMark";
import ComputerCheck from "./ComputerCheck";
import RealProjects from "./RealProjects";
import styles from "./ready.module.css";
import { EARLY_ACCESS_HREF } from "./early-access";

export const metadata: Metadata = {
  title: "Ready to Build",
  description: "Have an old computer? Check what you have, protect your files, and explore a path to your first simple live project with Ready to Build.",
  alternates: { canonical: "/products/ready-to-build" },
  openGraph: {
    title: "Ready to Build | Step In The Ring",
    description: "Your computer. Your idea. Your first live project. Meet the practical AI build starter kit.",
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
const kit = [
  { title: "Understand and protect your computer", items: ["Computer-readiness checklist", "Backup and wipe/rebuild guidance", "Hardware and operating-system decision help", "Windows, Mac, and Linux setup paths"] },
  { title: "Prepare your workspace", items: ["Workspace setup with VS Code, Git, and Node.js", "GitHub guidance to keep a recoverable copy of your work", "Claude Code and Codex guidance", "Deployment setup with Vercel"] },
  { title: "Make your first project real", items: ["Copy-and-paste prompts", "First-project build plan", "Troubleshooting help", "Seven-day Step In The Ring path"] },
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
  ["Can I use Windows, Mac, or Linux?", "The kit is planned around Windows, Mac, and Linux paths, with differences called out where tools need a specific setup. Your machine must support a suitable operating system and the tools you choose. You do not need to run an AI model on the computer itself."],
  ["What can I realistically build in one day?", "Aim for one simple project: a personal site, a small resource page, or a basic tracker. Computer repairs, a slow setup, or learning a new tool can take longer. Larger apps, accounts, payments, and sensitive data need more design, testing, and iteration."],
  ["Is this the same as blindly accepting AI-generated code?", "No. Work in small steps. Ask the agent to explain changes, review them, test the page on a phone and a computer, and keep a recoverable copy in Git. Check that private information and credentials stay out of your published project. A confident AI answer is not a passing test."],
  ["What does it cost after the starter product?", "The founding release is planned as a low-cost, one-time digital purchase; its price and checkout are not live yet. No Step In The Ring subscription is required for this kit. AI tools, hosting, domains, and optional hardware may have separate costs depending on your choices and usage. Check each provider’s terms before signing up. Future challenges, templates, projects, and community offerings would be optional, with their own terms stated up front."],
];

export default function ReadyToBuildPage() {
  return (
    <main className={styles.page}>
      <Link className="breadcrumb" href="/builds">← Owner&apos;s Builds</Link>
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

      <section id="included" className={styles.section} aria-labelledby="kit-heading"><div className={styles.sectionIntro}><span className="kicker">The eventual Ready to Build kit</span><h2 id="kit-heading">What you will get help with</h2><p>The planned kit will help you decide whether your computer can run a suitable operating system and tools such as VS Code, Git, GitHub, Claude Code, Codex, and Vercel. Then it will walk you through a first small project, with checklists to follow and prompts to adapt.</p><p className={styles.small}>Planned contents for the founding release. The kit is in preparation and is not available to download yet.</p></div><div className={styles.threeColumns}>{kit.map(group => <article className={styles.kitCard} key={group.title}><h3>{group.title}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div><div className={styles.note}><strong>One prompt starts the work. You stay in charge.</strong><p>The planned process includes checkpoints to review, test, and approve what goes live. The seven-day path will help you improve what you made, one small rep at a time.</p></div></section>

      <section className={styles.section} aria-labelledby="examples-heading"><div className={styles.sectionIntro}><span className="kicker">What you can build</span><h2 id="examples-heading">Start with something that matters to you.</h2><p>Learn a process you can repeat, not just instructions for copying one project. Keep the first version small enough to finish.</p></div><div className={styles.examples}>{examples.map(([title, copy], i) => <article key={title}><span className={styles.number}>0{i + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

      <section id="first-build" className={styles.offer} aria-labelledby="offer-heading"><div><span className="kicker">The founding release</span><h2 id="offer-heading">Join the first build.</h2><p>A low-cost digital starter product. One purchase, a practical kit, and a process you can use again.</p><p>We’re preparing the first release. Request early access by email; there’s no payment today and no subscription to start.</p><p className={styles.small}>Later, Step In The Ring can bring you more challenges, templates, projects, and community. Your first build stands on its own.</p></div><div className={styles.offerAction}><span className={styles.release}>Early access</span><p>Price and release date to be announced.</p><a className="btn btn-gold" href={EARLY_ACCESS_HREF}>Join the first build <span aria-hidden="true">↗</span></a><p className={styles.small}>Opens your email app. Send your request to <a href={EARLY_ACCESS_HREF}>ask@openmirrorllc.com</a>. Nothing is submitted until you send it.</p><Link className={styles.textLink} href="/build-machine">Explore the free Linux Build Machine tool →</Link></div></section>

      <section className={styles.section} aria-labelledby="faq-heading"><div className={styles.sectionIntro}><span className="kicker">A few fair questions</span><h2 id="faq-heading">Before you step in.</h2></div><div className={styles.faq}>{faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>

      <section className={styles.closing}><RingMark /><span className="kicker">Ready when you are</span><h2>Take the computer you already have.<br />Bring the idea you keep putting off.<br /><span>Step in and build it.</span></h2><a className="btn btn-gold btn-big" href="#computer-check">Check my computer →</a></section>
    </main>
  );
}
