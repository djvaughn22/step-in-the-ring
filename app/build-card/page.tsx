import Link from "next/link";

export default function BuildCardPage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">🧾 The first product</p>
        <h1>The Build Card is the first win.</h1>
        <p className="lede">
          Before a database, payment screen, or login system, every dream needs
          one clear card that says what we are building and why.
        </p>
      </section>

      <section className="section">
        <div className="build-card">
          <span className="badge">Sample Build Card</span>
          <h2>Dream Builder MVP</h2>
          <dl>
            <div>
              <dt>Dream</dt>
              <dd>A guided place where someone can turn an idea into an app.</dd>
            </div>
            <div>
              <dt>Audience</dt>
              <dd>Families, first-time creators, small teams, and approved projects.</dd>
            </div>
            <div>
              <dt>Smallest useful version</dt>
              <dd>A form that creates a clear MVP1 Build Card.</dd>
            </div>
            <div>
              <dt>Next round</dt>
              <dd>Turn the Build Card into a one-screen clickable prototype.</dd>
            </div>
          </dl>
        </div>

        <div className="action-row">
          <Link className="button primary" href="/enter">
            Make your own
          </Link>
        </div>
      </section>
    </main>
  );
}
