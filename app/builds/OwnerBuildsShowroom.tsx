// Made here: everything Open Mirror has built, from the one list in
// app/work/work.ts, as big showcase tiles. /work redirects here, so this is the
// portfolio for Build it with us and the showroom for building it yourself.

import Link from "next/link";
import Portfolio from "../work/Portfolio";
import { SHOWCASE_COUNT } from "../work/work";

export default function OwnerBuildsShowroom() {
  return (
    <section className="owner-showroom" aria-labelledby="owner-builds-heading">
      <div className="owner-showroom-hero">
        <span className="kicker">Made here</span>
        <h1 id="owner-builds-heading">See what we&apos;ve built.</h1>
        <p>
          {`${SHOWCASE_COUNT} live sites and games we planned, built and still run ourselves. `}They&apos;re
          Open Mirror&apos;s own projects, not client work. Open any of them.
        </p>
        <div className="actions">
          <Link className="btn btn-gold" href="/create">Make something like this →</Link>
          <Link className="btn btn-ghost" href="/request">Request a project</Link>
        </div>
      </div>

      <Portfolio />

      <div className="owner-showroom-cta">
        <div>
          <span className="kicker">Your turn</span>
          <h2>Have an idea? Let&apos;s build it.</h2>
          <p>
            Tell us what you have in mind and we&apos;ll reply with questions or a written quote. Or make it
            yourself with the free tools here.
          </p>
        </div>
        <div className="actions">
          <Link className="btn btn-gold" href="/request">Request a project</Link>
          <Link className="btn btn-ghost" href="/create">Start on your own</Link>
          <Link className="text-link" href="/services">Services and prices&nbsp;→</Link>
        </div>
      </div>
    </section>
  );
}
