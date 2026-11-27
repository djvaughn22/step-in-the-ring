import type { Metadata } from "next";
import Link from "next/link";
import RingMark from "../site/RingMark";
import AtAGlance from "./AtAGlance";
import { AVAILABILITY_LABEL, HELP_LINE, READY_EMAIL, publicPaths } from "./catalog";
import styles from "./products.module.css";

// Ways to make it real (owner direction, Nov 25 2026; Nov 26-27: only what's
// usable now). Guides and tools someone can use today, with no account. No
// prices, no planned paid products, no sign-ups for later; bigger help is one
// plain email.
export const metadata: Metadata = {
  title: "Ways to make it real",
  description:
    "Guides and tools for making something real: a website, a computer set up to build, a launch plan or a price to test. No account needed.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero} style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <span className="kicker">Ways to make it real</span>
          <h1>
            Make something real. <span>Start with what&apos;s here.</span>
          </h1>
          <p className={styles.subtitle}>
            Guides and tools you can use today, with no account. Start wherever fits, and switch any time.
          </p>
        </div>
      </header>

      {publicPaths().map((path, i) => (
        <section key={path.id} id={path.id} className={styles.path} aria-labelledby={`${path.id}-h`}>
          <div className={styles.pathHead}>
            <span className={styles.pathNumber}>0{i + 1}</span>
            <h2 id={`${path.id}-h`}>{path.title}</h2>
            <p>{path.line}</p>
          </div>
          <ul className={path.items.length > 2 ? styles.grid : styles.grid3}>
            {path.items.map((item) => {
              const card = (
                <div className={styles.card}>
                  <div className={styles.cardTop}>
                    <h3>{item.title}</h3>
                    <span className={styles.status} data-a={item.availability}>
                      {AVAILABILITY_LABEL[item.availability]}
                    </span>
                  </div>
                  <p>{item.line}</p>
                  {item.href && (
                    <span className={styles.go}>
                      {item.availability === "free" ? "Open" : item.availability === "paused" || item.availability === "open" ? "See how it works" : "See what's inside"}&nbsp;→
                    </span>
                  )}
                </div>
              );
              // Products without a page of their own carry their six facts here.
              if (!item.href && item.detail) {
                return (
                  <li key={item.title} className={styles.card}>
                    <div className={styles.cardTop}>
                      <h3>{item.title}</h3>
                      <span className={styles.status} data-a={item.availability}>{AVAILABILITY_LABEL[item.availability]}</span>
                    </div>
                    <p>{item.line}</p>
                    <details className={styles.more}>
                      <summary>At a glance</summary>
                      <AtAGlance detail={item.detail} />
                    </details>
                  </li>
                );
              }
              return (
                <li key={item.title}>
                  {item.href ? (
                    <Link className={styles.cardLink} href={item.href}>
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className={styles.closing} aria-labelledby="proof-h">
        <RingMark />
        <h2 id="proof-h">See what gets made here.</h2>
        <p>
          Real projects, and an honest list of what works today and what doesn&apos;t yet.
        </p>
        <div className={styles.actions} style={{ justifyContent: "center" }}>
          <Link className="btn btn-gold" href="/live">
            Things made here&nbsp;→
          </Link>
          <Link className={styles.textLink} href="/whats-built">
            What works today
          </Link>
        </div>
        <p className={styles.small}>
          {HELP_LINE}{" "}
          <a href={`mailto:${READY_EMAIL}?subject=${encodeURIComponent("Step In The Ring")}`}>{READY_EMAIL}</a>
        </p>
      </section>
    </main>
  );
}
