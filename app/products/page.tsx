import type { Metadata } from "next";
import Link from "next/link";
import RingMark from "../site/RingMark";
import { AVAILABILITY_LABEL, PATHS, READY_EMAIL } from "./catalog";
import styles from "./products.module.css";

// Ways to make it real (owner direction, Nov 25 2026). Step In The Ring is
// where someone decides to make something real and finds a practical way to
// do it: a guide they keep, our free tools, or (when it's open) having it
// built. No prices here; nothing is for sale until the owner opens sales.
export const metadata: Metadata = {
  title: "Ways to make it real",
  description:
    "Guides you keep and free tools for making something real: a website, a build machine from an old computer, or a small business of your own.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero} style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <span className="kicker">Ways to make it real</span>
          <h1>
            Make something real. <span>Pick how much help you want.</span>
          </h1>
          <p className={styles.subtitle}>
            Some people want a guide and a quiet evening. Some want tools that carry the heavy parts. Some want
            it made for them. Start wherever fits, and switch any time.
          </p>
        </div>
      </header>

      {PATHS.map((path, i) => (
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
                      {item.availability === "coming" ? "See what's inside" : "Open"}&nbsp;→
                    </span>
                  )}
                </div>
              );
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
          Questions, or want to hear when a guide is ready?{" "}
          <a href={`mailto:${READY_EMAIL}?subject=${encodeURIComponent("Step In The Ring guides")}`}>{READY_EMAIL}</a>
        </p>
      </section>
    </main>
  );
}
