import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">🎟️ Simple access</p>
        <h1>Free while we test. Simple later.</h1>
        <p className="lede">
          The first mission is to prove the guided process with family and
          approved projects. No payment system yet.
        </p>
      </section>

      <section className="section">
        <div className="grid two">
          <article className="card price-card">
            <span className="badge">Now</span>
            <h2>Family test</h2>
            <div className="price">$0</div>
            <p>
              Free private testing while we learn what makes the Ring helpful,
              fun, safe, and clear.
            </p>
          </article>

          <article className="card">
            <span className="badge">Later</span>
            <h2>Approved projects</h2>
            <div className="price">$10</div>
            <p>
              Planned monthly access for approved projects once the process,
              customer fit, and safety boundaries are ready.
            </p>
          </article>
        </div>

        <div className="action-row">
          <Link className="button primary" href="/enter">
            Try the free test flow
          </Link>
        </div>
      </section>
    </main>
  );
}
