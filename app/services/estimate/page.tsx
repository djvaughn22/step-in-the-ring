import type { Metadata } from "next";
import Link from "next/link";
import { exampleBySlug } from "../../starter/examples";
import { PAID_HELP_OPEN } from "../../site/paidHelp";
import EstimateBuilder from "./EstimateBuilder";
import styles from "./estimate.module.css";

// "Have us build it": a scope summary in hours (owner direction, Nov 25 2026).
// No prices until the owner approves them. While paid help is paused the
// page sends nothing and stays out of search.
export const metadata: Metadata = {
  title: "What would it take to build?",
  description: "Choose pages, look, features and upkeep, and see roughly how much work a website would take. No prices; a written quote comes first.",
  alternates: { canonical: "/services/estimate" },
  ...(PAID_HELP_OPEN ? {} : { robots: { index: false } }),
};

type Props = { searchParams: Promise<{ pages?: string; example?: string }> };

export default async function EstimatePage({ searchParams }: Props) {
  const q = await searchParams;
  const pages = Math.max(1, Math.min(30, Number.parseInt(q.pages ?? "1", 10) || 1));
  // Only an example's slug ever arrives here (never anything a person typed).
  const ex = q.example ? exampleBySlug(q.example) : undefined;
  return (
    <main className={styles.page}>
      <Link className="breadcrumb" href="/products#build-it">← Ways to make it real</Link>
      <header className={styles.head}>
        <span className="kicker">Have us build it</span>
        <h1>What would it take to build?</h1>
        <p>
          Pick what your site needs and see roughly how much work it is. It&apos;s an estimate of effort, not a
          price: every project starts with a conversation and a written quote.
        </p>
      </header>
      <EstimateBuilder startPages={pages} exampleName={ex?.name} open={PAID_HELP_OPEN} />
    </main>
  );
}
