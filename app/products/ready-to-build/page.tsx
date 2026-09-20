import type { Metadata } from "next";
import Link from "next/link";
import RingMark from "../../site/RingMark";
import styles from "./ready.module.css";
import { EARLY_ACCESS_HREF } from "./early-access";

export const metadata: Metadata = {
  title: "Ready to Build",
  description: "Rebuild an old computer. Turn it into an AI build machine. Go live with your idea in one day. A practical starter kit from Step In The Ring.",
  alternates: { canonical: "/products/ready-to-build" },
  openGraph: {
    title: "Ready to Build | Step In The Ring",
    description: "Your computer. Your idea. Your first live project. Meet the practical AI build starter kit.",
    url: "/products/ready-to-build",
  },
};

const steps = [
  ["01", "REBUILD IT", "Give your computer its next chapter.", "Diagnose what works, back up your files, and clean up or reinstall safely. Decide whether a small upgrade is worthwhile before spending money."],
  ["02", "PREPARE IT", "Make a place where ideas can happen.", "Follow the setup path for your computer: VS Code, Git, Node.js, Claude Code or Codex, a GitHub account, and the tools to publish your work."],
  ["03", "LAUNCH IT", "Make something small. Make it live.", "Describe your idea, build with AI, and test what it makes. Publish your first simple website or app, then share a live link you can be proud of."],
];
const kit = [
  { title: "A computer you can build on", items: ["Old-computer readiness checklist", "Rebuild and clean-install guidance", "Hardware and software decision guide", "Windows, Mac, and Linux setup paths"] },
  { title: "A workspace you understand", items: ["VS Code workspace setup", "Claude Code and Codex workflow", "GitHub and Vercel deployment setup", "One-prompt build/deploy workflow, with review checkpoints"] },
  { title: "A plan you can actually finish", items: ["Copy-and-paste prompts", "Troubleshooting guide", "First-project launch plan", "Seven-day Step In The Ring challenge"] },
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
      <Link className="breadcrumb" href="/library">← Library</Link>
      <header className={styles.hero}>
        <div>
          <span className="kicker">Your first rep starts here</span>
          <p className={styles.product}>Ready to Build</p>
          <h1>Turn an old computer into your <span>AI build machine.</span></h1>
          <p className={styles.subtitle}>Rebuild an old computer. Turn it into an AI build machine. Go live with your idea in one day.</p>
          <p>Clean up or rebuild the computer you already own, install the right tools, and use AI coding agents to create and publish your first simple project. Your idea. Your files. A real link to share.</p>
          <div className={styles.actions}><a className="btn btn-gold" href="#first-build">Get Ready to Build <span aria-hidden="true">→</span></a><a className={styles.textLink} href="#included">See what’s included ↓</a></div>
          <p className={styles.small}>One day is a goal for a first simple project. Repairs and larger ideas take longer.</p>
        </div>
        <div className={styles.workbench} aria-label="Illustration of a first project, from computer to live website">
          <div className={styles.workbenchTop}><RingMark /><span>YOUR NEXT CHAPTER<br /><strong>Starts on your desk.</strong></span></div>
          <div className={styles.computer}><div className={styles.screen}><span className={styles.screenLabel}>MY FIRST PROJECT / PREVIEW</span><div className={styles.preview}><span className={styles.previewMark} aria-hidden="true">↗</span><strong>Hello, world.<br />I made this.</strong><p>A small idea.<br />A place on the internet.</p><span className={styles.previewButton}>Ready to share</span></div></div><div className={styles.keyboard} /></div>
          <div className={styles.workbenchBottom}><span>From “maybe someday”</span><strong>to “here’s the link.” ↗</strong></div>
          <p className={styles.small}>An example of your first finish line.</p>
        </div>
      </header>

      <ol className={styles.progress} aria-label="Your path to a live project">{["Old computer", "Ready workspace", "Working project", "Live on the internet"].map((label, i) => <li key={label}><span className={styles.number}>0{i + 1}</span><strong>{label}</strong>{i < 3 && <span className={styles.arrow} aria-hidden="true">→</span>}</li>)}</ol>

      <section className={styles.section} aria-labelledby="steps-heading"><div className={styles.sectionIntro}><span className="kicker">Three practical steps</span><h2 id="steps-heading">You don’t need a fresh start.<br />Just a useful next step.</h2><p>For parents, hobbyists, first-time creators, and anyone with an idea that deserves a first try.</p></div><div className={styles.threeColumns}>{steps.map(([n, label, title, copy]) => <article className={styles.step} key={n}><span className={styles.stepNumber}>{n}</span><span className="kicker">{label}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

      <section id="included" className={styles.section} aria-labelledby="kit-heading"><div className={styles.sectionIntro}><span className="kicker">Inside Ready to Build</span><h2 id="kit-heading">Less theory. More “I did it.”</h2><p>A practical digital kit to keep beside you while you work. Checklists to follow, prompts to adapt, and a clear next step when you get stuck.</p><p className={styles.small}>Planned contents for the founding release. The kit is in preparation and is not available to download yet.</p></div><div className={styles.threeColumns}>{kit.map(group => <article className={styles.kitCard} key={group.title}><h3>{group.title}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div><div className={styles.note}><strong>One prompt starts the work. You stay in charge.</strong><p>The build/deploy workflow includes checkpoints to review, test, and approve what goes live. Then the seven-day challenge helps you improve what you made, one small rep at a time.</p></div></section>

      <section className={styles.section} aria-labelledby="examples-heading"><div className={styles.sectionIntro}><span className="kicker">What you can build</span><h2 id="examples-heading">Start with something that matters to you.</h2><p>Learn a process you can repeat, not just instructions for copying one project. Keep the first version small enough to finish.</p></div><div className={styles.examples}>{examples.map(([title, copy], i) => <article key={title}><span className={styles.number}>0{i + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

      <section id="first-build" className={styles.offer} aria-labelledby="offer-heading"><div><span className="kicker">The founding release</span><h2 id="offer-heading">Join the first build.</h2><p>A low-cost digital starter product. One purchase, a practical kit, and a process you can use again.</p><p>We’re preparing the first release. Request early access by email; there’s no payment today and no subscription to start.</p><p className={styles.small}>Later, Step In The Ring can bring you more challenges, templates, projects, and community. Your first build stands on its own.</p></div><div className={styles.offerAction}><span className={styles.release}>Early access</span><p>Price and release date to be announced.</p><a className="btn btn-gold" href={EARLY_ACCESS_HREF}>Join the first build <span aria-hidden="true">↗</span></a><p className={styles.small}>Opens your email app. Send your request to <a href={EARLY_ACCESS_HREF}>ask@openmirrorllc.com</a>. Nothing is submitted until you send it.</p><Link className={styles.textLink} href="/build-machine">Start with the free Build Machine tool →</Link></div></section>

      <section className={styles.section} aria-labelledby="faq-heading"><div className={styles.sectionIntro}><span className="kicker">A few fair questions</span><h2 id="faq-heading">Before you step in.</h2></div><div className={styles.faq}>{faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>

      <section className={styles.closing}><RingMark /><span className="kicker">Ready when you are</span><h2>Take the computer you already have.<br />Bring the idea you keep putting off.<br /><span>Step in and build it.</span></h2><a className="btn btn-gold btn-big" href="#first-build">Get Ready to Build →</a></section>
    </main>
  );
}
