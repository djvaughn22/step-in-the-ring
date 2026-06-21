import Link from "next/link";

const steps = [
  ["Dream it", "Bring the idea, app, mission, business, family project, or tool you cannot stop thinking about."],
  ["Shape it", "Turn the dream into a tiny first version that a real person can understand and test."],
  ["Build it", "Use AI with guided prompts, clear steps, and simple checks instead of guessing what to do next."],
  ["Test it", "Click through the prototype, find what feels wrong, and learn what needs to improve."],
  ["Improve it", "Go round by round until MVP1 feels tight, useful, and real."],
  ["Launch it", "Share only when it is ready, safe, and approved for the people it is meant to serve."],
];

export default function Home() {
  return (
    <main className="main">
      <section className="hero">
        <div>
          <p className="eyebrow">🎡 Private family test now open</p>
          <h1>Step In The Ring</h1>
          <p className="lede">
            A guided AI build park where everyday people walk through the Ring
            and turn dreams into simple working app prototypes.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/enter">
              Enter the Ring
            </Link>
            <Link className="button secondary" href="/ring-leader">
              Meet the Ring Leader
            </Link>
          </div>
        </div>

        <div className="portal-card" aria-label="A glowing ring portal">
          <div className="portal-ring">◎</div>
          <h2>Where dreams become apps.</h2>
          <p>
            A fun, guided world for building the smallest real version of a dream.
          </p>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">🎟️ How the park works</p>
        <h2>One dream. Six rounds.</h2>
        <div className="grid six">
          {steps.map(([title, copy], index) => (
            <article className="card" key={title}>
              <div className="step-number">{index + 1}</div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section soft">
        <div className="grid two">
          <article>
            <p className="eyebrow">🤖 Your guide</p>
            <h2>The Ring Leader</h2>
            <p className="lede">
              The Ring Leader helps you know what to ask AI, what answer to
              look for, what to test, what to fix, and what to do next.
            </p>
            <div className="action-row">
              <Link className="button primary" href="/ring-leader">
                See the guide
              </Link>
            </div>
          </article>

          <article className="card">
            <span className="badge">The promise</span>
            <h3>Your dream gets a map.</h3>
            <p>
              Step In The Ring turns a dream into a clear path: what to build,
              what to ask AI, what to test, and what to improve next.
            </p>
            <p>
              The first win is simple: one small prototype that feels real
              enough to show, test, and improve.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
