import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">About</p>
        <h1>A guided way to make ideas easier to build.</h1>
        <p className="lede">
          Step In The Ring helps everyday people take a rough idea and shape it
          into a small first prototype with AI.
        </p>
      </section>

      <section className="section">
        <div className="grid two">
          <article className="card">
            <h3>Start small</h3>
            <p>
              The first version should be simple enough to understand, build,
              and test.
            </p>
          </article>

          <article className="card">
            <h3>Use AI clearly</h3>
            <p>
              Good prompts, simple checks, and smaller steps make AI more useful
              for real projects.
            </p>
          </article>

          <article className="card">
            <h3>Test with real people</h3>
            <p>
              A prototype gets better when someone can click it, use it, and
              explain what feels unclear.
            </p>
          </article>

          <article className="card">
            <h3>Improve one step at a time</h3>
            <p>
              Each pass should make the idea clearer, more useful, and easier to
              finish.
            </p>
          </article>
        </div>

        <div className="action-row">
          <Link className="button primary" href="/enter">
            Start a project
          </Link>
        </div>
      </section>
    </main>
  );
}
