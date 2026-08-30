"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { interpret, type PlannerInput } from "../planner/interpret";
import { buildBuilderPrompt } from "../planner/builder-prompt";
import { BUILD_SEED_KEY } from "../planner/handoff";
import Link from "next/link";
import CreationEntry from "../vnext/CreationEntry";
import SteppedIn from "../vnext/SteppedIn";
import ContinueStrip from "../vnext/ContinueStrip";
import { shapingFromView } from "../vnext/shape";
import { saveDraft } from "../vnext/draft";
import { deletePlan, loadPlans, savePlan, type SavedPlan } from "../planner/storage";
import { BUILD_TYPE_LABEL, type Interpretation } from "../planner/types";
import { adapterForType } from "../creation/adapters";
import { track } from "../lib/analytics";
import {
  loadBuilderDefaults, saveBuilderDefaults, type BuilderDefaults,
} from "../creation/builder-defaults";
import { downloadBuildPack, downloadCreationJson } from "../creation/build-pack";
import { readHandoffFromSearch } from "../creation/handoff";
import {
  newRecord, saveCurrentCreation, viewOf, type CreationView,
} from "../creation/record";
import { recommendEngines } from "../creation/recommend";
import { projectFromCreation } from "../project/from-creation";
import { saveProjectRecord } from "../project/store";
import { ECOSYSTEM, homepageProof } from "../site/registry";
import { QUICK_START, QUICK_STARTERS, STARTING_POINT_GROUPS, STARTING_POINTS } from "./starting-points";
import { displayName, featuredCapabilities } from "../vnext/capabilities";
import {
  CREATION_TYPE_LABEL, SOFTWARE_VERDICT_LABEL, type HandoffPayloadV1,
} from "../creation/types";

type Stage = "landing" | "stepped" | "result" | "saved";

/* The ways in. One list, shared with the Create page and the starting-point
   column, so the site can never offer two different sets of first moves. */
const STARTERS = QUICK_STARTERS;
const FEATURED_ENGINES = featuredCapabilities();
/* CrossHeartPray, TheDJCares, iDontCry first, then every other real, live
   product — the homepage proof panel's fixed order. See app/site/registry.ts. */
const { primary: HOME_PROOF_PRIMARY, more: HOME_PROOF_MORE } = homepageProof(ECOSYSTEM);

/** The brand mark: the ring itself, read from above — a floor, a rope line,
 *  four posts. The same three shapes the box on the right is framed with,
 *  shrunk to an icon, so the name and the mark say the same thing twice. */
function RingMark() {
  return (
    <svg
      className="ring-mark-icon"
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="6" y="6" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <rect x="11" y="11" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <rect x="1.5" y="1.5" width="7" height="7" fill="currentColor" />
      <rect x="31.5" y="1.5" width="7" height="7" fill="currentColor" />
      <rect x="1.5" y="31.5" width="7" height="7" fill="currentColor" />
      <rect x="31.5" y="31.5" width="7" height="7" fill="currentColor" />
    </svg>
  );
}

function CopyButton({ text, label, big }: { text: string; label: string; big?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`btn ${big ? "btn-gold" : "btn-ghost btn-small"}`}
        onClick={() => {
          const done = () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
          };
          navigator.clipboard?.writeText(text).then(done).catch(() => {
            // Older phone webviews: fall back to a hidden textarea.
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try {
              document.execCommand("copy");
              done();
            } finally {
              document.body.removeChild(ta);
            }
          });
        }}
      >
        {copied ? "Copied" : label}
      </button>
      {/* Confirmation reaches a screen reader, not just the eye. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Builder prompt copied to your clipboard" : ""}
      </span>
    </>
  );
}

/** What we understood — shown before the plan, and before any question. */
function UnderstoodCard({ i, view }: { i: Interpretation; view?: CreationView | null }) {
  return (
    <div className="card card-gold">
      <div className="plan-label">What I think you&apos;re making</div>
      <h2 style={{ marginBottom: 10 }}>{i.title.value}</h2>
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.6 }}>{i.summary}</p>
      <div className="pill-row">
        <span className="pill">{BUILD_TYPE_LABEL[i.buildType.value]}</span>
        {view && <span className="pill">{CREATION_TYPE_LABEL[view.creationType]}</span>}
        {i.destination && <span className="pill">Lands on {i.destination.value}</span>}
        {/* Lowercase the first letter only — blanket toLowerCase() turns
            OpenDoku into "opendoku" and mangles every product name. */}
        {(view?.primaryUser || i.audience) && (
          <span className="pill">
            For {(view?.primaryUser ?? i.audience!.value).charAt(0).toLowerCase() + (view?.primaryUser ?? i.audience!.value).slice(1)}
          </span>
        )}
      </div>
      {view && (
        <div style={{ marginTop: 12, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>
            <b style={{ color: "var(--text)" }}>The real result:</b>{" "}
            {view.smallestOutcome}
          </p>
          <p style={{ margin: "6px 0 0" }}>
            <b style={{ color: "var(--text)" }}>{SOFTWARE_VERDICT_LABEL[view.software.verdict]}.</b>{" "}
            {view.software.reason}
            {view.software.nonSoftwareTest && (
              <> <span style={{ color: "var(--text)" }}>Cheapest first test:</span> {view.software.nonSoftwareTest}</>
            )}
          </p>
          {view.record.source === "idontcry" && (
            <p style={{ margin: "6px 0 0" }}>
              Carried over from iDontCry — your original words came with it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Builder Defaults — how far the builder goes, saved on this device. */
function BuilderDefaultsPanel({ value, onChange }: { value: BuilderDefaults; onChange: (d: BuilderDefaults) => void }) {
  const set = (patch: Partial<BuilderDefaults>) => {
    const next = { ...value, ...patch };
    saveBuilderDefaults(next);
    onChange(next);
  };
  const selStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", background: "var(--surface)",
    border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
    padding: "9px 10px", fontSize: 14, fontFamily: "inherit",
  };
  return (
    <details className="card">
      <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Builder defaults — how your prompts run
      </summary>
      <p className="field-help" style={{ margin: "10px 0 12px" }}>
        Baked into every generated prompt. Saved on this device only — no account, no names.
      </p>
      <div className="row2">
        <div>
          <label htmlFor="bd-work" style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Where the work lands</label>
          <select id="bd-work" style={selStyle} value={value.workMode} onChange={(e) => set({ workMode: e.target.value as BuilderDefaults["workMode"] })}>
            <option value="new-standalone">New standalone build — start clean</option>
            <option value="existing-repo">Existing repository — inspect first</option>
          </select>
        </div>
        <div>
          <label htmlFor="bd-git" style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 4 }}>How far it goes</label>
          <select id="bd-git" style={selStyle} value={value.gitMode} onChange={(e) => set({ gitMode: e.target.value as BuilderDefaults["gitMode"] })}>
            <option value="prototype">Prototype only — no commits</option>
            <option value="build-commit">Build and commit</option>
            <option value="build-commit-push">Build, commit, and push</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <label htmlFor="bd-notes" style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
          Anything else every prompt should say (optional)
        </label>
        <textarea
          id="bd-notes"
          rows={2}
          style={{ ...selStyle, resize: "vertical" }}
          value={value.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="e.g. Tailwind only; keep copy plain and human."
        />
      </div>
    </details>
  );
}

/**
 * The creation flow, mounted twice.
 *
 *   mode="home"    the front door: the question, the four ways in, the loop,
 *                  and a short row of real things that got made
 *   mode="create"  the workbench: the same question given the whole screen,
 *                  with starting points beside it for somebody who has none
 *
 * Everything after the first sentence — reading it, shaping it, the plan, the
 * builder prompt — is identical, because it is literally the same component.
 * Two front doors into one flow, not two flows.
 */
export default function RingApp({ mode = "home" }: { mode?: "home" | "create" }) {
  const [stage, setStage] = useState<Stage>("landing");
  const [description, setDescription] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<SavedPlan[]>([]);
  const [flash, setFlash] = useState("");
  const [incoming, setIncoming] = useState<HandoffPayloadV1 | null>(null);
  const [defaults, setDefaults] = useState<BuilderDefaults>(loadBuilderDefaults);
  const shapeRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadPlans());
    setDefaults(loadBuilderDefaults());
    try {
      // Versioned handoff (?cr=) first — it carries the whole creation.
      // The idea box lives on the landing page now, so a handoff simply
      // prefills it and puts the cursor there — one screen fewer to cross.
      const payload = readHandoffFromSearch(window.location.search);
      if (payload) {
        setIncoming(payload);
        setDescription(payload.idea.slice(0, 2000));
        setTimeout(() => shapeRef.current?.focus(), 0);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      // Legacy handoff from iDontCry's Dream Lab: ?idea=... still works.
      const idea = params.get("idea");
      if (idea && idea.trim()) {
        setDescription(idea.trim().slice(0, 600));
        setTimeout(() => shapeRef.current?.focus(), 0);
        return;
      }
      // A starting point taken from the Library arrives as ?stem=. It is a
      // half-finished sentence, not an idea: the cursor goes to the END of it
      // so the person carries straight on typing in their own words.
      const stem = params.get("stem");
      if (stem && stem.trim()) {
        const text = stem.slice(0, 200);
        setDescription(text);
        setTimeout(() => {
          const el = shapeRef.current;
          if (!el) return;
          el.focus();
          el.setSelectionRange(text.length, text.length);
        }, 0);
      }
    } catch {}
  }, []);

  const input: PlannerInput = useMemo(() => ({ description, answers }), [description, answers]);
  const plan = useMemo(
    () => (description.trim() ? interpret(input) : null),
    [input, description],
  );
  /* The creation record — one creation, wherever it started. Edits to the
     description ARE the creator's words, so the record follows them; a
     handoff's structured facts and origin ride along untouched. */
  const record = useMemo(() => {
    if (!description.trim()) return null;
    return newRecord(description, {
      answers,
      ...(incoming
        ? {
            source: "idontcry" as const,
            sourceFlow: incoming.flow,
            originalTitle: incoming.title,
            facts: { ...(incoming.facts ?? {}), ...(incoming.typeHint ? { typeHint: incoming.typeHint } : {}) },
            exclusions: incoming.exclusions ?? [],
          }
        : {}),
    });
  }, [description, answers, incoming]);
  // `plan` already interpreted these exact words — reuse it, don't recompute.
  const view = useMemo(() => (record ? viewOf(record, plan ?? undefined) : null), [record, plan]);
  /* The shaping IS the step-in moment. It reuses the view this page already
     computed — one reading of their words, shown two ways. */
  const shaping = useMemo(() => (view ? shapingFromView(view) : null), [view]);
  const engineRec = useMemo(() => (view ? recommendEngines(view) : null), [view]);
  /* Repo-touching work keeps the permission-aware brief (never claims access
     or authority the person didn't give). Standalone creations get their
     creation-type prompt — a game brief for a game, a design brief for a
     design, never a generic app plan for a story. */
  const builderPrompt = useMemo(() => {
    if (!plan) return "";
    const repoWork = !!plan.destination || plan.permissions.build || plan.permissions.commit || plan.permissions.push;
    if (view && !repoWork) return adapterForType(view.creationType).prompt(view, defaults);
    return buildBuilderPrompt(plan);
  }, [plan, view, defaults]);

  // The current creation survives a refresh — resume is one tap.
  useEffect(() => {
    if (stage === "result" && view) saveCurrentCreation(view.record);
  }, [stage, view]);
  useEffect(() => {
    if (stage === "result" && view) track("plan_result_viewed", { type: view.creationType });
    // Once per arrival at the result, not per keystroke of a correction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function go(next: Stage) {
    setStage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleShape(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    go("stepped");
  }

  /* Put the idea in flight so the sign-in round trip costs nothing, then let
     the link navigate normally. sessionStorage, this tab — never described to
     anyone as saved work. */
  function keepThisBuild() {
    saveDraft(description, answers);
    track("build_kept_from_step_in", {});
  }

  /* Answering the one question re-reads their words in place — the card above
     it sharpens without a page move. Deterministic, instant, free. */
  function answerQuestion(key: string, answer: string) {
    setAnswers({ ...answers, [key]: answer });
  }

  function skipQuestion(key: string) {
    // Skipping is allowed — we already have a safe assumption for it.
    setAnswers({ ...answers, [key]: "" });
  }

  function startOver() {
    setDescription("");
    setAnswers({});
    setIncoming(null);
    go("landing");
  }

  /** Hand the whole creation record to an engine, then follow the route. */
  function seedEngineWithRecord(engineId: string) {
    if (!view) return;
    try {
      window.localStorage.setItem(
        "sitr-engine-seed",
        JSON.stringify({
          engineId,
          title: view.interpretation.title.value,
          summary: view.interpretation.summary,
          raw: view.record.originalIdea,
          record: view.record,
        }),
      );
      // "first-build" is /build, the six-round first-app coach — it lives
      // outside the Engine Room and only ever reads its own seed key, never
      // sitr-engine-seed. Without this it opens blank and the person retypes
      // the app name and purpose they already gave us.
      if (engineId === "first-build") {
        window.localStorage.setItem(
          BUILD_SEED_KEY,
          JSON.stringify({ appName: view.interpretation.title.value, purpose: view.interpretation.summary }),
        );
      }
    } catch {}
  }

  function handleSave() {
    if (!plan) return;
    setSaved(savePlan(input, plan.title.value));
    setFlash("Saved to your corner.");
    setTimeout(() => setFlash(""), 2500);
  }

  /** Promote the creation to a full project — workspace, gates, evidence. */
  function makeProject() {
    if (!view || !plan) return;
    const project = projectFromCreation(view.record, plan);
    saveProjectRecord(project);
    track("project_created", { adapter: project.adapterId, from: "planner" });
    window.location.href = `/projects?p=${project.projectId}`;
  }

  function openSaved(p: SavedPlan) {
    setDescription(p.description);
    setAnswers(p.answers ?? {});
    go("result");
  }

  /* ── THE BOX. The one question, rendered the same way on both front doors so
     it is recognisably the same act in both places. ── */
  const theBox = (
    <CreationEntry
      id="idea-description"
      heading="What do you want to make?"
      help="Messy is fine."
      placeholder="A puzzle game where you pick a photo and drag the pieces back together."
      submitLabel="Start"
      rows={5}
      value={description}
      onValueChange={setDescription}
      onSubmit={handleShape}
      inputRef={shapeRef}
      starters={STARTERS}
      actions={
        <>
          {saved.length > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => go("saved")}>
              Saved ({saved.length})
            </button>
          )}
        </>
      }
    />
  );

  /* A starting point is a stem, not a category. It lands in the box and the
     person finishes the sentence — the reading still comes from their words. */
  function takeStartingPoint(stem: string) {
    setDescription(stem);
    const el = shapeRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(stem.length, stem.length);
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  /* ── CREATE — the workbench. The question gets the whole screen, and the
     person who has nothing in their head gets a column of real first moves
     beside it instead of a blank box and good luck. ── */
  if (stage === "landing" && mode === "create") {
    return (
      <main>
        <div className="page">
          {/* Deliberately short. On this page the BOX is the hero — a full
              masthead would push the one thing a person came here to use
              below the fold on a laptop. */}
          <header className="mast mast-tight">
            <span className="kicker">Create</span>
            <h1 className="mast-title">Start something</h1>
            <p className="mast-lead">
              Say what you want to make. You get back what it really is, the
              smallest version that would actually work, and the first move.
            </p>
          </header>

          <div className="work2">
            <div>
              {theBox}
              <ContinueStrip />
            </div>

            <aside className="sidecol" id="starting-points">
              <h2 className="side-title">Need an idea?</h2>
              <p className="side-note">
                Pick one. It drops a half-finished sentence in the box and you
                finish it.
              </p>
              {STARTING_POINT_GROUPS.map((g) => (
                <div key={g.id} className="sp-group">
                  <h3 className="sp-group-t">{g.title}</h3>
                  <div className="sp-list">
                    {STARTING_POINTS.filter((sp) => sp.group === g.id).map((sp) => (
                      <button
                        key={sp.label}
                        type="button"
                        className="sp"
                        onClick={() => takeStartingPoint(sp.stem)}
                      >
                        <span className="sp-mark" aria-hidden="true">{sp.emoji}</span>
                        <span className="sp-body">
                          <span className="sp-label">{sp.label}</span>
                          <span className="sp-what">{sp.what}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <p className="side-foot">
                Looking for a specific tool instead?{" "}
                <Link href="/engines">Open the engines</Link>.
              </p>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  /* ── HOME — the front door. It has ten seconds to answer three questions:
     what is this, what do I do first, and what if I don't know. ── */
  if (stage === "landing") {
    return (
      <main>
        <div className="page">
          <section className="stage">
            {/* ── LEFT: MAKE SOMETHING. The idea entry and its own working
                "Start" submit button — the one dominant creation action on
                the page. No second CTA competing with it. ~60% of the
                hero. ── */}
            <div className="stage-make">
              <span className="stage-mark">Step In The Ring</span>
              <h1 className="ring-display ring-brand">
                <RingMark />
                The Ring
              </h1>
              <p className="ring-tagline">Bring the idea. Leave with something real.</p>
              <p className="ring-sub" style={{ marginTop: 16 }}>
                Start with one sentence. Shape it, build it, and keep moving
                until it works.
              </p>

              {/* The one visual nod to the name — a frame, not a costume. */}
              <div className="ring-frame" style={{ marginTop: 26 }}>
                <span className="ring-post ring-post-tl" aria-hidden="true" />
                <span className="ring-post ring-post-tr" aria-hidden="true" />
                <span className="ring-post ring-post-bl" aria-hidden="true" />
                <span className="ring-post ring-post-br" aria-hidden="true" />
                <span className="ring-rope ring-rope-1" aria-hidden="true" />
                <span className="ring-rope ring-rope-2" aria-hidden="true" />
                <span className="ring-rope ring-rope-3" aria-hidden="true" />
                {theBox}
              </div>

            </div>

            {/* ── RIGHT: REAL PROOF. CrossHeartPray, TheDJCares, and
                iDontCry — real, live products that can be opened and used
                right now. Compact horizontal cards sized to their content,
                so this column ends near the bottom of the creation box
                instead of towering past it. Every other real, live product
                gets its own full-width band below the hero, not a second
                list stacked in here. ~40% of the hero. ── */}
            <aside className="stage-proof">
              <h2 className="stage-proof-heading">Made in The Ring</h2>
              <div className="proof-list">
                {HOME_PROOF_PRIMARY.map((p) => (
                  <a
                    key={p.name}
                    className="proof-row"
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={
                      {
                        "--tile-accent": p.accent,
                        "--tile-soft": `${p.accent}1A`,
                      } as React.CSSProperties
                    }
                  >
                    <span className="proof-mark" aria-hidden="true">{p.emoji}</span>
                    <span className="proof-body">
                      <span className="proof-name">{p.name}</span>
                      <span className="proof-what">{p.what}</span>
                    </span>
                    <span className="proof-side">
                      <span className="proof-status"><span className="dot" />Live</span>
                      <span className="proof-open" aria-hidden="true">↗</span>
                    </span>
                  </a>
                ))}
              </div>
            </aside>
          </section>

          {/* ── MORE MADE HERE. Every other real, live product in the
              catalog, full page width, compact horizontal rows — a second
              proof band, not a second column stacked under the first. ── */}
          {HOME_PROOF_MORE.length > 0 && (
            <section className="band band-tight more-products-band">
              <h2 className="stage-proof-heading">More made here</h2>
              <div className="more-products">
                {HOME_PROOF_MORE.map((p) => (
                  <a
                    key={p.name}
                    className="proof-row proof-row-compact"
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={
                      {
                        "--tile-accent": p.accent,
                        "--tile-soft": `${p.accent}1A`,
                      } as React.CSSProperties
                    }
                  >
                    <span className="proof-mark" aria-hidden="true">{p.emoji}</span>
                    <span className="proof-body">
                      <span className="proof-name">{p.name}</span>
                      <span className="proof-what">{p.what}</span>
                    </span>
                    <span className="proof-side">
                      <span className="proof-open" aria-hidden="true">↗</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Somebody who was here yesterday sees their work first, in one
              quiet strip of its own — never inside the hero, never printing
              what the build actually is. A stranger sees nothing here. */}
          <ContinueStrip />

          {/* ── QUICK START. Four doors, not eight — proof that this handles
              more than one kind of thing, not a menu to study. Each one drops
              a stem straight into the box above and puts the cursor in it, so
              picking one is the SAME ACT as typing, not a detour into a
              picker screen. ── */}
          <section className="band band-tight">
            <div className="band-head">
              <h2 className="band-title">Quick start</h2>
              <p className="band-note">Pick one and finish the sentence in the box above.</p>
            </div>
            <div className="qs-grid">
              {QUICK_START.map((q) => (
                <button key={q.label} type="button" className="qs" onClick={() => takeStartingPoint(q.stem)}>
                  <span className="qs-mark" aria-hidden="true">{q.emoji}</span>
                  <span className="qs-label">{q.label}</span>
                  <span className="qs-what">{q.what}</span>
                </button>
              ))}
            </div>
            <p className="tiny" style={{ marginTop: 14 }}>
              Know exactly what you want? <Link href="/create#starting-points" className="more">More starting points</Link>.
            </p>
          </section>

          {/* ── TOOLS FOR THE JOB. Five, curated — not all twelve. The whole
              catalog stays one click away for the person who wants it. ── */}
          <section className="band">
            <div className="band-head">
              <h2 className="band-title">Tools for the job</h2>
              <p className="band-note">Already know which part you&apos;re on? Go straight to the tool for it.</p>
            </div>
            <div className="eng-grid">
              {FEATURED_ENGINES.map((c) => (
                <article key={c.id} className="eng eng-compact">
                  <header className="eng-head">
                    <span className="eng-mark" aria-hidden="true">{c.emoji}</span>
                    <h3 className="eng-name">{displayName(c)}</h3>
                  </header>
                  {c.useWhen && (
                    <p className="eng-when">
                      <span className="eng-when-k">Use this to</span>
                      {c.useWhen}
                    </p>
                  )}
                  <footer className="eng-foot">
                    <Link href={c.href} className="btn btn-gold btn-small">Open</Link>
                  </footer>
                </article>
              ))}
            </div>
            <p className="tiny" style={{ marginTop: 16 }}>
              <Link href="/engines" className="more">See all engines</Link>
            </p>
          </section>

          {/* ── THE LOOP ── */}
          <section className="band">
            <div className="band-head">
              <h2 className="band-title">How it goes</h2>
              <p className="band-note">
                The same five moves every time, whether it&apos;s an app, a song
                or a practice plan.
              </p>
            </div>
            <div className="loop">
              {[
                ["01", "Say it", "In your own words. No form to fill in."],
                ["02", "Shape it", "See what it really is before any plan shows up."],
                ["03", "Make it", "The smallest version that actually works."],
                ["04", "Try it", "Use it yourself. If it doesn't work for you it isn't done."],
                ["05", "Go again", "Fix it, grow it, or start the next one."],
              ].map(([n, t, d]) => (
                <div key={n} className="loop-step">
                  <span className="loop-n">{n}</span>
                  <h3 className="loop-t">{t}</h3>
                  <p className="loop-d">{d}</p>
                </div>
              ))}
            </div>
            <p className="tiny" style={{ marginTop: 16 }}>
              <Link href="/how" className="more">More on how it works</Link>
            </p>
          </section>

          {/* No closing section here on purpose: it used to repeat the
              hero's "Made in The Ring" line and its own second big "Start
              something" button — a duplicate of the box's own dominant
              Start action, just at the bottom of the page. The open-beta
              safety line that used to live here moved to the quiet,
              sitewide footer (app/site/QuietFooterLink.tsx), where every
              page gets it once, not just Home. */}
        </div>
      </main>
    );
  }

  /* ── STEPPED IN — the moment after they said it. Deterministic, instant. ── */
  if (stage === "stepped" && shaping) {
    return (
      <main>
        <div className="page">
          <SteppedIn
            intent={description.trim()}
            shaping={shaping}
            onAnswer={answerQuestion}
            onSkip={skipQuestion}
            onChangeWords={() => go("landing")}
            onSeeWholePlan={() => go("result")}
            onKeep={keepThisBuild}
            onOpenHelp={seedEngineWithRecord}
            keepHref="/builds"
          />
        </div>
      </main>
    );
  }

  /* ── SAVED ── */
  if (stage === "saved") {
    return (
      <main>
        <div className="page">
          <div className="topbar">
            <span className="topbar-title">Your corner — saved plans</span>
            <button className="btn btn-ghost btn-small" onClick={() => go("landing")}>Back</button>
          </div>
          {saved.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ marginBottom: 20 }}>Nothing saved yet.</p>
              <button className="btn btn-gold" onClick={() => go("landing")}>Start a creation</button>
            </div>
          ) : (
            <div className="stack">
              {saved.map((p) => (
                <div key={p.id} className="saved-item">
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, marginBottom: 4 }}>{p.title}</h3>
                    <p style={{ fontSize: 12 }}>{p.description.slice(0, 110)}{p.description.length > 110 ? "…" : ""}</p>
                    <p style={{ fontSize: 11, marginTop: 4, color: "var(--dim)" }}>
                      {new Date(p.savedAt).toLocaleDateString()}
                      {p.legacy ? " · from your older saves" : ""}
                    </p>
                  </div>
                  <div className="actions" style={{ flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-small" onClick={() => openSaved(p)}>Open</button>
                    <button className="btn btn-ghost btn-small" onClick={() => setSaved(deletePlan(p.id))}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ── RESULT ── */
  if (stage === "result" && plan) {
    const decided = plan.assumptions;
    return (
      <main>
        <div className="page">
          <div className="topbar">
            <span className="topbar-title">Your plan</span>
            <button className="btn btn-ghost btn-small" onClick={startOver}>Start over</button>
          </div>

          <div className="stack">
            <UnderstoodCard i={plan} view={view} />

            {/* BRING IT → the persistent object. The plan below is yours
                either way; this is what makes it survive this browser. */}
            <div className="card">
              <div className="plan-label">Keep going with this</div>
              <p style={{ fontSize: 14.5, color: "var(--text)", margin: "0 0 12px" }}>
                Save it as a build and it&apos;s on your account — still here tomorrow, on
                any device, with the next move on it.
              </p>
              <div className="actions">
                <a
                  className="btn btn-gold"
                  href={`/builds?intent=${encodeURIComponent(description.trim().slice(0, 2000))}`}
                >
                  Make it a build →
                </a>
              </div>
            </div>

            {plan.versionOne.length > 0 && (
              <div className="card">
                <div className="plan-label">What version one does</div>
                <ul className="plan-list">
                  {plan.versionOne.map((c, n) => (
                    <li key={n}>
                      {c.value}
                      {c.confidence !== "stated" && <span className="tag">my call</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(plan.assets.length > 0 || plan.preserve.length > 0) && (
              <div className="row2">
                {plan.assets.length > 0 && (
                  <div className="card">
                    <div className="plan-label">What it already has</div>
                    <ul className="plan-list">
                      {plan.assets.map((c, n) => <li key={n}>{c.value}</li>)}
                    </ul>
                  </div>
                )}
                {plan.preserve.length > 0 && (
                  <div className="card">
                    <div className="plan-label">Don&apos;t break</div>
                    <ul className="plan-list">
                      {plan.preserve.map((p, n) => <li key={n}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {plan.exclusions.length > 0 && (
              <div className="card">
                <div className="plan-label" style={{ color: "var(--muted)" }}>Not in version one</div>
                <ul className="plan-list">
                  {plan.exclusions.map((c, n) => <li key={n}>{c.value}</li>)}
                </ul>
              </div>
            )}

            {/* Their own words about what "done" means — inferences already
                live on the understood card as "the real result". */}
            {plan.desiredResult && plan.desiredResult.confidence === "stated" && (
              <div className="card">
                <div className="plan-label">Ready when</div>
                <p className="plan-value" style={{ fontSize: 14 }}>{plan.desiredResult.value}</p>
              </div>
            )}

            {/* Tools and setup, honestly — what to use, what's manual once,
                what turns automatic, what deliberately waits. */}
            {view && (
              <div className="card">
                <div className="plan-label">The tools this needs</div>
                <p className="plan-value" style={{ fontSize: 14.5 }}>{view.tools.stack}</p>
                <p className="field-help" style={{ margin: "4px 0 0" }}>{view.tools.why}</p>
                {view.tools.noSetup.length > 0 && (
                  <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "10px 0 0", lineHeight: 1.55 }}>
                    <b style={{ color: "var(--text)" }}>No setup needed:</b> {view.tools.noSetup.join(" ")}
                  </p>
                )}
                {view.tools.setup.length > 0 && (
                  <>
                    <p className="tools-sub">You set up once</p>
                    <ul className="plan-list">
                      {view.tools.setup.map((s, n) => <li key={n}>{s}</li>)}
                    </ul>
                  </>
                )}
                {view.tools.automatic.length > 0 && (
                  <>
                    <p className="tools-sub">Automatic after that</p>
                    <ul className="plan-list">
                      {view.tools.automatic.map((s, n) => <li key={n}>{s}</li>)}
                    </ul>
                  </>
                )}
                {view.tools.optional.length > 0 && (
                  <>
                    <p className="tools-sub">Optional — know the cost first</p>
                    <ul className="plan-list">
                      {view.tools.optional.map((s, n) => <li key={n}>{s}</li>)}
                    </ul>
                  </>
                )}
                {view.tools.wait.length > 0 && (
                  <>
                    <p className="tools-sub">You don&apos;t need yet</p>
                    <ul className="plan-list">
                      {view.tools.wait.map((s, n) => <li key={n}>{s}</li>)}
                    </ul>
                  </>
                )}
              </div>
            )}

            {decided.length > 0 && (
              <details className="card">
                <summary className="plan-label" style={{ marginBottom: 0 }}>
                  Calls I made for you ({decided.length}) — open to check them
                </summary>
                <p className="field-help" style={{ margin: "8px 0 10px" }}>
                  Safe assumptions so you could keep moving. Wrong ones are worth fixing.
                </p>
                <ul className="plan-list">
                  {decided.map((a, n) => <li key={n}>{a}</li>)}
                </ul>
              </details>
            )}

            {/* ONE next step — an engine door, or the prompt path, never both. */}
            {engineRec && (
              <div className="next-action">
                <div className="plan-label">Next step</div>
                {engineRec.primary ? (
                  <a
                    href={engineRec.primary.route}
                    className="door-card"
                    style={{ marginBottom: engineRec.alternates.length ? 10 : 0 }}
                    onClick={() => seedEngineWithRecord(engineRec.primary!.engineId)}
                  >
                    <span className="door-emoji" aria-hidden="true">→</span>
                    <div>
                      <h3>Continue in {engineRec.primary.name}</h3>
                      <p>{engineRec.primary.why} Your creation comes with you — nothing gets retyped.</p>
                    </div>
                    <span className="door-go" aria-hidden="true">→</span>
                  </a>
                ) : (
                  <>
                    <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                      {engineRec.promptPathWhy}
                    </p>
                    <p className="plan-value" style={{ fontSize: 14, marginTop: 8 }}>{plan.completionAction}</p>
                  </>
                )}
                {engineRec.alternates.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {engineRec.alternates.map((alt) => (
                      <a
                        key={alt.engineId}
                        href={alt.route}
                        onClick={() => seedEngineWithRecord(alt.engineId)}
                        style={{ display: "block", fontSize: 13.5, color: "var(--muted)", textDecoration: "none", lineHeight: 1.6, marginTop: 4 }}
                      >
                        <b style={{ color: "var(--gold)" }}>or {alt.name} →</b> {alt.why}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* The builder prompt is the handoff. One card holds it and the
                two files that carry it — nothing else competes with it. */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div className="plan-label" style={{ margin: 0 }}>Your builder prompt</div>
                <CopyButton text={builderPrompt} label="Copy builder prompt" big />
              </div>
              <pre className="prompt-box">{builderPrompt}</pre>
              <p className="field-help" style={{ marginTop: 12, marginBottom: 0 }}>
                Copy it into the building tool you already use, and start.
              </p>
              {view && (
                <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 14 }}>
                  <p className="field-help" style={{ marginBottom: 10 }}>
                    Or take the whole creation with you — the readable brief, and the record you can
                    bring back later.
                  </p>
                  <div className="actions">
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => downloadBuildPack(view, builderPrompt)}
                    >
                      Download brief (.md)
                    </button>
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => downloadCreationJson(view)}
                    >
                      Download record (.json)
                    </button>
                    <button className="btn btn-ghost btn-small" onClick={makeProject}>
                      Make it a project
                    </button>
                  </div>
                </div>
              )}
            </div>

            <BuilderDefaultsPanel value={defaults} onChange={setDefaults} />

            <div className="actions">
              <button className="btn btn-primary" onClick={() => go("landing")}>Fix this plan</button>
              <button className="btn btn-ghost btn-small" onClick={handleSave}>Save it</button>
              {saved.length > 0 && (
                <button className="btn btn-ghost btn-small" onClick={() => go("saved")}>Your corner</button>
              )}
            </div>
            <span role="status" aria-live="polite" className="tiny">{flash}</span>

            <div className="divider" />

            {/* Mission haikus live on the hub About page only — no stanza here. */}
            <p className="tiny" style={{ textAlign: "center" }}>
              <a href="https://openmirrorllc.com/contact" style={{ display: "inline-block", color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
                Contact Open Mirror →
              </a>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
