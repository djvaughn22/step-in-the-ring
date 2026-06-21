import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">Pricing</p>
        <h1>Free while the process is being tested.</h1>
        <p className="lede">
          The first goal is to make the guided path useful for small approved
          projects.
        </p>
      </section>

      <section className="section">
        <div className="grid two">
          <article className="card price-card">
            <span className="badge">Now</span>
            <h2>Private test</h2>
            <div className="price">$0</div>
            <p>
              Private testing while the questions, Build Card, and guided steps
              get simpler and more useful.
            </p>
          </article>

          <article className="card">
            <span className="badge">Later</span>
            <h2>Approved projects</h2>
            <div className="price">$10</div>
            <p>
              Planned monthly access for approved projects after the guided
              process feels clear.
            </p>
          </article>
        </div>

        <div className="action-row">
          <Link className="button primary" href="/enter">
            Start the free test
          </Link>
        </div>
      </section>
    </main>
  );
}
