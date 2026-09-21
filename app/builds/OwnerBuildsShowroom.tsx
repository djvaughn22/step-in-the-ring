"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OWNER_BUILD_CATEGORIES, OWNER_BUILDS, ownerBuildsForCategory, type OwnerBuildCategory } from "./owner-builds";

function BuildLink({ build, children, className }: { build: { href: string; external: boolean }; children: React.ReactNode; className?: string }) {
  if (build.external) {
    return <a className={className} href={build.href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  return <Link className={className} href={build.href}>{children}</Link>;
}

export default function OwnerBuildsShowroom() {
  const [category, setCategory] = useState<"all" | OwnerBuildCategory>("all");
  const visible = useMemo(
    () => ownerBuildsForCategory(category).filter((build) => !build.featured),
    [category],
  );
  const featured = ownerBuildsForCategory("all").filter((build) => build.featured);

  return (
    <section className="owner-showroom" aria-labelledby="owner-builds-heading">
      <div className="owner-showroom-hero">
        <span className="kicker">Owner&apos;s Builds</span>
        <h1 id="owner-builds-heading">See what we&apos;ve built.</h1>
        <p>Every project starts with an idea. Explore the live websites, tools, games, experiments, and products built through the Step In The Ring process—and use them as inspiration for what you could create next.</p>
        <div className="actions">
          <Link className="btn btn-gold" href="/products/ready-to-build">I want to build something like this →</Link>
          <Link className="btn btn-ghost" href="/create">Start with an idea</Link>
        </div>
      </div>

      <div className="owner-featured" aria-labelledby="featured-builds-heading">
        <div className="owner-section-head"><div><span className="kicker">A few places to begin</span><h2 id="featured-builds-heading">Featured builds</h2></div><span className="owner-count">{OWNER_BUILD_CATEGORIES.length - 1} ways to explore</span></div>
        <div className="owner-featured-grid">
          {featured.map((build) => <OwnerBuildCard key={build.name} build={build} featured />)}
        </div>
      </div>

      <div className="owner-directory" id="all-builds">
        <div className="owner-section-head"><div><span className="kicker">The living showroom</span><h2>Explore all builds</h2></div><span className="owner-count">{OWNER_BUILD_CATEGORIES.length - 1} categories · {OWNER_BUILDS.length} builds</span></div>
        <div className="owner-filters" role="group" aria-label="Filter owner builds">
          {OWNER_BUILD_CATEGORIES.map((item) => <button key={item.id} type="button" className={category === item.id ? "active" : undefined} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}
        </div>
        {visible.length > 0 ? <div className="owner-build-grid">{visible.map((build) => <OwnerBuildCard key={build.name} build={build} />)}</div> : <div className="owner-empty"><h3>No builds in this category yet.</h3><p>Come back as more projects take shape, or start something with the idea box.</p><Link className="text-link" href="/create">Start a new build →</Link></div>}
      </div>

      <div className="owner-showroom-cta"><span className="kicker">Your turn</span><h2>Which one makes you want to try?</h2><p>Take the pattern that catches your eye, bring your own subject, and start with the computer and idea you already have.</p><div className="actions"><Link className="btn btn-gold" href="/products/ready-to-build">Get Ready to Build →</Link><Link className="text-link" href="/create">Open the creation process →</Link></div></div>
    </section>
  );
}

function OwnerBuildCard({ build, featured = false }: { build: ReturnType<typeof ownerBuildsForCategory>[number]; featured?: boolean }) {
  return (
    <article className={`owner-build-card${featured ? " featured" : ""}`} style={{ "--owner-accent": build.accent } as React.CSSProperties}>
      <div className="owner-build-card-top"><span className="owner-build-icon" aria-hidden="true">{build.emoji}</span><span className="owner-status">{build.status}</span></div>
      <span className="owner-category">{build.categoryLabel}</span>
      <h3>{build.name}</h3>
      <p>{build.description}</p>
      <p className="owner-lesson">{build.lesson}</p>
      <BuildLink build={build} className="owner-visit">Visit {build.name} <span aria-hidden="true">{build.external ? "↗" : "→"}</span></BuildLink>
    </article>
  );
}
