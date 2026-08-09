"use client";

// The Your Builds surface. Everything server-owned arrives as props; the only
// things this component does on its own are (a) create a Build through the
// existing member projects API and (b) LOOK — never write — at pre-vNext work
// in this browser.

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import CreationEntry from "../vnext/CreationEntry";
import LegacyWork from "../vnext/LegacyWork";
import { BUILD_ENGINE_ID, capabilitiesForIntent } from "../vnext/capabilities";
import {
  BUILD_STAGE_LABEL, BUILD_STAGE_LINE, BUILD_STAGES, newBuild, serializeBuild,
  type BuildRecordV1,
} from "../vnext/build";

function StageTrack({ stage }: { stage: BuildRecordV1["stage"] }) {
  const at = BUILD_STAGES.indexOf(stage);
  return (
    <div className="pill-row" aria-label={`Stage: ${BUILD_STAGE_LABEL[stage]}`}>
      {BUILD_STAGES.map((s, i) => (
        <span key={s} className={`pill${i === at ? " pill-now" : ""}`} aria-current={i === at ? "step" : undefined}>
          {BUILD_STAGE_LABEL[s]}
        </span>
      ))}
    </div>
  );
}

function BuildCard({ build }: { build: BuildRecordV1 }) {
  const suggested = useMemo(() => capabilitiesForIntent(build.intent, 3), [build.intent]);
  return (
    <article className="card card-gold" style={{ marginBottom: 16 }}>
      <div className="plan-label">{BUILD_STAGE_LINE[build.stage]}</div>
      <h2 style={{ marginBottom: 8 }}>{build.title}</h2>
      <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.6 }}>{build.intent}</p>
      <StageTrack stage={build.stage} />
      {build.currentAction && (
        <div className="next-action" style={{ marginTop: 12 }}>
          <span className="kicker" style={{ marginBottom: 4 }}>Right now</span>
          <p style={{ color: "var(--text)", fontWeight: 600, margin: 0 }}>{build.currentAction}</p>
        </div>
      )}
      {suggested.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <span className="kicker" style={{ marginBottom: 6 }}>What can help</span>
          <div className="chip-row">
            {suggested.map((c) => (
              <a key={c.id} className="chip" href={c.href}>
                <span aria-hidden="true">{c.emoji}</span> {c.name}
              </a>
            ))}
          </div>
        </div>
      )}
      {build.artifacts.length > 0 && (
        <ul className="plan-list" style={{ marginTop: 12 }}>
          {build.artifacts.map((a) => (
            <li key={a.id}>{a.label}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function BuildsClient({
  builds,
  signedIn,
  canSave,
  storeConfigured,
  email,
  initialIntent,
  listFailed,
}: {
  builds: BuildRecordV1[];
  signedIn: boolean;
  canSave: boolean;
  storeConfigured: boolean;
  email: string | null;
  /** Handed over from the landing page as ?intent=, read on the server. */
  initialIntent: string;
  /** The account list could not be read. NOT the same as having no builds. */
  listFailed: boolean;
}) {
  const [intent, setIntent] = useState(initialIntent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createBuild(e: FormEvent) {
    e.preventDefault();
    const said = intent.trim();
    if (!said || busy) return;
    setBusy(true);
    setError(null);
    const record = newBuild(said);
    try {
      const res = await fetch("/api/members/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: record.title,
          engineId: BUILD_ENGINE_ID,
          content: serializeBuild(record),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "That didn't save. Try again.");
        setBusy(false);
        return;
      }
      // The list is server-rendered — come back to it with the new Build in place.
      window.location.href = "/builds";
    } catch {
      setError("That didn't save. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <main>
      <div className="page">
        <section className="hero hero-compact" style={{ textAlign: "left" }}>
          <span className="kicker">Step In The Ring</span>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 44px)" }}>Your builds</h1>
          <p className="hero-sub" style={{ margin: "10px 0 0", maxWidth: 520 }}>
            {builds.length > 0
              ? "Keep going."
              : "What you're making lives here — from the first sentence to live."}
          </p>
        </section>

        {listFailed && (
          <section className="home-section">
            <div className="card">
              <h3>Your builds didn&apos;t load</h3>
              <p>
                Something went wrong reading your account — this is not the same as having
                no builds, and nothing was lost. Reload in a moment.
              </p>
            </div>
          </section>
        )}

        {signedIn && builds.length > 0 && (
          <section className="home-section" aria-label="Your builds">
            {builds.map((b) => (
              <BuildCard key={b.id} build={b} />
            ))}
          </section>
        )}

        {signedIn && (
          <section className="home-section">
            <span className="kicker">{builds.length > 0 ? "Start another" : "Create something"}</span>
            <CreationEntry
              id="new-build"
              value={intent}
              onValueChange={setIntent}
              onSubmit={createBuild}
              heading="What do you want to create?"
              help="Say it however it comes out. It becomes a build you can come back to."
              submitLabel={busy ? "Saving…" : "Step in →"}
              disabled={busy || !canSave}
              rows={4}
            />
            {!canSave && (
              <p className="tiny" style={{ marginTop: 8 }}>
                Saving a build needs live access on your account.{" "}
                <a href="/membership" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
                  See what that means →
                </a>
              </p>
            )}
            {error && (
              <p className="tiny" role="alert" style={{ marginTop: 8, color: "var(--text)", fontWeight: 700 }}>
                {error}
              </p>
            )}
          </section>
        )}

        {!signedIn && (
          <section className="home-section">
            {/* Somebody arrived here from their own idea. Their words are the
                valuable thing — show them back, carry them through the sign-in
                round trip, and never make them retype what they already said. */}
            {initialIntent.trim() && (
              <div className="card card-gold" style={{ marginBottom: 16 }}>
                <div className="plan-label">Ready to keep</div>
                <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
                  {initialIntent.trim()}
                </p>
                <p className="tiny" style={{ marginTop: 10 }}>
                  This is still here when you come back — signing in is what puts it on your
                  account instead of just this browser.
                </p>
              </div>
            )}
            <div className="card">
              <h3>Sign in to keep your builds</h3>
              <p>
                {storeConfigured
                  ? "A build saved to your account is on the server, not just this browser — so it's still there on your phone tomorrow."
                  : "Accounts aren't switched on for this site yet. Anything you've made here is still in this browser, listed below."}
              </p>
              {storeConfigured && (
                <div className="actions" style={{ marginTop: 12 }}>
                  <a
                    className="btn btn-gold"
                    href={`/members/login?returnTo=${encodeURIComponent(
                      initialIntent.trim() ? `/builds?intent=${encodeURIComponent(initialIntent.trim())}` : "/builds",
                    )}`}
                  >
                    Sign in
                  </a>
                  <Link className="btn btn-ghost btn-small" href="/">Start something first</Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Everything from before vNext. Read-only, always shown. */}
        <LegacyWork />

        <div className="divider" />
        <p className="tiny" style={{ textAlign: "center" }}>
          {email ? `Signed in as ${email}. ` : ""}
          <a href="/library" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
            Everything Step In The Ring can do →
          </a>
        </p>
      </div>
    </main>
  );
}
