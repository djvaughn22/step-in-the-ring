import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">◎ Why this exists</p>
        <h1>Step In The Ring turns dreams into guided build adventures.</h1>
        <p className="lede">
          Step In The Ring is for people with real dreams who need a guided path
          from idea to working prototype.
        </p>
      </section>

      <section className="section">
        <div className="grid two">
          <article className="card">
            <h3>Dream-first building</h3>
            <p>
              You start by explaining the dream and shaping the smallest useful version.
            </p>
          </article>

          <article className="card">
            <h3>Guided build-along</h3>
            <p>
              The first version is a guided build-along that helps you use AI tools with clarity while the automation grows over time.
            </p>
          </article>

          <article className="card">
            <h3>Family-safe first</h3>
            <p>
              The first testers are family and approved projects. The goal is a
              useful, safe, encouraging system before scale.
            </p>
          </article>

          <article className="card">
            <h3>Round by round</h3>
            <p>
              Each round makes the idea clearer, smaller, more testable, and
              closer to something real.
            </p>
          </article>
        </div>

        <div className="action-row">
          <Link className="button primary" href="/enter">
            Step in
          </Link>
        </div>
      </section>
    </main>
  );
}
