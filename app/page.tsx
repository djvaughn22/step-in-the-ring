import Link from "next/link";

const steps = [
  ["Name the idea", "Write the idea in plain language."],
  ["Choose the user", "Decide who the first version is for."],
  ["Make it smaller", "Find the smallest useful version."],
  ["Plan the first screen", "Decide what the user sees and does first."],
  ["Build with AI", "Use guided prompts and simple checks."],
  ["Improve it", "Test the result and make the next version better."],
];

export default function Home() {
  return (
    <main className="main">
      <section className="hero">
        <div>
          <p className="eyebrow">Private test</p>
          <h1>Turn an idea into a first prototype.</h1>
          <p className="lede">
            A simple guided workspace that helps you shape a rough idea, create
            a Build Card, and take the next practical step with AI.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/enter">
              Start a project
            </Link>
            <Link className="button secondary" href="/guide">
              See the guide
            </Link>
          </div>
        </div>

        <div className="concept-card" aria-label="Simple idea-to-prototype path">
          <div className="simple-path">
            <div className="path-row">
              <div className="path-number">1</div>
              <div>
                <strong>Start with the idea</strong>
                <span>Write what you want to make in normal words.</span>
              </div>
            </div>
            <div className="path-row">
              <div className="path-number">2</div>
              <div>
                <strong>Create a Build Card</strong>
                <span>Clarify the user, purpose, first screen, and first action.</span>
              </div>
            </div>
            <div className="path-row">
              <div className="path-number">3</div>
              <div>
                <strong>Build the first version</strong>
                <span>Use AI one step at a time and test what you made.</span>
              </div>
            </div>
          </div>
          <h2>Small enough to start. Clear enough to build.</h2>
          <p>
            The goal is a first version you can click, test, explain, and
            improve.
          </p>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">The process</p>
        <h2>A practical path for first versions.</h2>
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
            <p className="eyebrow">First outcome</p>
            <h2>Start with a Build Card.</h2>
            <p className="lede">
              The Build Card gives the project a clear starting point before it
              becomes bigger or more complicated.
            </p>
            <div className="action-row">
              <Link className="button primary" href="/enter">
                Create one
              </Link>
            </div>
          </article>

          <article className="card">
            <span className="badge">What it captures</span>
            <h3>The basic shape of the project</h3>
            <p>
              Idea, user, purpose, smallest useful version, first screen, first
              action, and next step.
            </p>
            <p>
              That is enough to begin building without turning the project into
              something too big too soon.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
