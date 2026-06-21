import Link from "next/link";

const steps = [
  ["Name the idea", "Write the idea in plain language so it is easy to understand."],
  ["Choose the user", "Decide who the first version is really for."],
  ["Make it smaller", "Find the smallest useful version that can be built and tested."],
  ["Create the first screen", "Decide what the user sees first and what action they take."],
  ["Build with AI", "Use guided prompts and simple checks to create the first working version."],
  ["Improve it", "Test it, notice what is confusing, and make the next version better."],
];

export default function Home() {
  return (
    <main className="main">
      <section className="hero">
        <div>
          <p className="eyebrow">Private family test</p>
          <h1>Step In The Ring</h1>
          <p className="lede">
            A simple guided workspace for turning an idea into a first working
            prototype with AI.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/enter">
              Start a project
            </Link>
            <Link className="button secondary" href="/guide">
              See how it works
            </Link>
          </div>
        </div>

        <div className="concept-card" aria-label="Simple idea-to-prototype path">
          <div className="quiet-ring">○</div>
          <h2>Idea to prototype, one step at a time.</h2>
          <p>
            Start with a rough idea. Leave with a clear Build Card, a smaller
            first version, and the next step to build it.
          </p>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">The path</p>
        <h2>A quieter way to start building.</h2>
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
            <p className="eyebrow">Your guide</p>
            <h2>Simple guidance for the next step.</h2>
            <p className="lede">
              Step In The Ring helps you move from a loose idea to a clear plan,
              then from that plan to a small working prototype.
            </p>
            <div className="action-row">
              <Link className="button primary" href="/enter">
                Start with an idea
              </Link>
            </div>
          </article>

          <article className="card">
            <span className="badge">First outcome</span>
            <h3>A Build Card</h3>
            <p>
              The Build Card captures the idea, the first user, the smallest
              useful version, the first screen, and the next build step.
            </p>
            <p>
              It gives the project a calm starting point before anything gets
              bigger or more complicated.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
