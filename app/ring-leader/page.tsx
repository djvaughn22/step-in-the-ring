import Link from "next/link";

const jobs = [
  ["Dream Translator", "Turns messy ideas into simple product language."],
  ["Prompt Coach", "Tells you what to ask AI and what answer to look for."],
  ["MVP Referee", "Keeps the first version small enough to actually finish."],
  ["Test Guide", "Helps you click, observe, fix, and improve round by round."],
];

export default function RingLeaderPage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">🤖 Meet your guide</p>
        <h1>The Ring Leader walks with you round by round.</h1>
        <p className="lede">
          The Ring Leader is a clear guided process that helps a normal person use AI with confidence, one round at a time.
        </p>
      </section>

      <section className="section">
        <div className="grid two">
          {jobs.map(([title, copy]) => (
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
