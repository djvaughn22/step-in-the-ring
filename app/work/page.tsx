import type { Metadata } from "next";
import Link from "next/link";
import { Masthead, Sheet, accentVars } from "../site/ui";
import { workWithIdentity } from "./work";

export const metadata: Metadata = {
  title: "Our work",
  description:
    "Live websites and web apps planned, built and run by Open Mirror LLC, the company behind Step In The Ring, and what each one shows we can build for you.",
};

export default function WorkPage() {
  const items = workWithIdentity();
  return (
    <Sheet wide>
      <Masthead
        kicker="Build it with us"
        title="Our work"
        lead="Live sites we planned, built and still run ourselves. They're Open Mirror's own projects, not client work. Each one shows something we can build for you."
      />
      <div className="work-grid">
        {items.map(({ name, what, shows, project }) => (
          <article key={name} className="work-card" style={accentVars(project.accent)}>
            <div className="work-top">
              <span className="work-icon" aria-hidden="true">{project.emoji}</span>
              <h2>{name}</h2>
            </div>
            <p className="work-what">{what}</p>
            <p className="work-shows-label">What it shows</p>
            <ul>
              {shows.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <a className="work-link" href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              Visit {name} <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}
      </div>
      <section className="svc-final" aria-labelledby="work-final">
        <h2 id="work-final">Have an idea? Let&apos;s build it.</h2>
        <p>Tell us what you have in mind, and we&apos;ll reply with questions or a written quote.</p>
        <div className="svc-final-go">
          <Link className="btn btn-gold btn-big" href="/request">Request a project</Link>
          <Link className="text-link" href="/services">Services and prices&nbsp; →</Link>
        </div>
      </section>
    </Sheet>
  );
}
