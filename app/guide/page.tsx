import Link from "next/link";

const items = [
  ["Clarify the idea", "Turn a rough thought into a simple project description."],
  ["Reduce the scope", "Keep the first version small enough to finish and test."],
  ["Use AI clearly", "Ask for one useful step at a time."],
  ["Check the result", "Notice what works, what is confusing, and what to improve."],
];

export default function GuidePage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">Guide</p>
        <h1>A simple path from idea to first prototype.</h1>
        <p className="lede">
          The guide helps shape the idea, choose the smallest useful version,
          and use AI one practical step at a time.
        </p>
      </section>

      <section className="section">
        <div className="grid two">
          {items.map(([title, copy]) => (
            <article className="card" key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>

        <div className="action-row">
          <Link className="button primary" href="/enter">
            Start a Build Card
          </Link>
        </div>
      </section>
    </main>
  );
}
