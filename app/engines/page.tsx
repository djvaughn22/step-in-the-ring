"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Step In The Ring — Engine Room
 * Turn a rough idea into a usable product card, plan, or outline,
 * then take it to /build. Deterministic templates (v1): no API calls,
 * all local state. Lives here because this site is idea -> real build.
 * ------------------------------------------------------------------ */

const STORAGE = "sitr-engines-v1";

// ---- Types --------------------------------------------------------
type Idea = { name: string; rough: string; who: string; why: string };
type Field = {
  key: string;
  label: string;
  placeholder?: string;
  type: "text" | "textarea" | "score";
};
type Section = { heading: string; body: string };
type Engine = {
  id: string;
  emoji: string;
  name: string;
  accent: string;
  blurb: string;
  fields: Field[];
  generate: (idea: Idea, v: Record<string, string>) => Section[];
  guardrail?: string;
  toBuild?: boolean; // show the "take it to /build" nudge under the result
};

// ---- Helpers ------------------------------------------------------
const emptyIdea: Idea = { name: "", rough: "", who: "", why: "" };
const or = (s: string | undefined, fallback: string) => (s && s.trim() ? s.trim() : `(${fallback})`);
const slug = (s: string | undefined) =>
  (s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "your-idea";

// ---- Engines ------------------------------------------------------
const ENGINES: Engine[] = [
  {
    id: "idea",
    emoji: "💡",
    name: "Idea Engine",
    accent: "#60A5FA",
    blurb: "Rough thought → clean product card.",
    toBuild: true,
    fields: [
      { key: "fastest", label: "Fastest usable version", type: "textarea", placeholder: "The smallest thing a real person could use this week." },
      { key: "risks", label: "Risks", type: "textarea", placeholder: "What could make this fail, break, or be unsafe?" },
      { key: "revenue", label: "Revenue / adoption path", type: "textarea", placeholder: "How does it reach people or make money?" },
    ],
    generate: (idea, v) => [
      { heading: idea.name.trim() || "Untitled idea", body: or(idea.rough, "one-line description of the idea") },
      { heading: "Who it helps", body: or(idea.who, "the specific person this is for") },
      { heading: "Why it matters", body: or(idea.why, "the real problem or moment it fits") },
      { heading: "Fastest usable version", body: or(v.fastest, "smallest thing someone could use this week") },
      { heading: "Risks", body: or(v.risks, "what could break, fail, or be unsafe") },
      { heading: "Revenue / adoption path", body: or(v.revenue, "how it reaches people or earns") },
    ],
  },
  {
    id: "score",
    emoji: "📊",
    name: "Score Engine",
    accent: "#A78BFA",
    blurb: "Score 1–5, get a verdict.",
    fields: [
      { key: "upside", label: "Upside", type: "score" },
      { key: "speed", label: "Speed to demo", type: "score" },
      { key: "revenue", label: "Revenue potential", type: "score" },
      { key: "clarity", label: "User clarity", type: "score" },
      { key: "wow", label: "Public wow factor", type: "score" },
      { key: "techsafe", label: "Technical safety (5 = low risk)", type: "score" },
      { key: "legalsafe", label: "Legal / trust safety (5 = low risk)", type: "score" },
      { key: "reuse", label: "Reusable infrastructure value", type: "score" },
      { key: "mission", label: "Mission fit", type: "score" },
    ],
    generate: (idea, v) => {
      const keys = ["upside", "speed", "revenue", "clarity", "wow", "techsafe", "legalsafe", "reuse", "mission"];
      const labels: Record<string, string> = {
        upside: "Upside", speed: "Speed to demo", revenue: "Revenue potential", clarity: "User clarity",
        wow: "Public wow factor", techsafe: "Technical safety", legalsafe: "Legal / trust safety",
        reuse: "Reusable infra value", mission: "Mission fit",
      };
      const nums = keys.map((k) => Math.min(5, Math.max(1, parseInt(v[k] || "3", 10))));
      const total = nums.reduce((a, b) => a + b, 0);
      let verdict: string;
      if (total >= 37) verdict = "✅ BUILD NOW";
      else if (total >= 29) verdict = "🔷 PROTOTYPE NEXT";
      else if (total >= 21) verdict = "🅿️ PARK";
      else verdict = "⛔ AVOID";
      const breakdown = keys.map((k, i) => `• ${labels[k]}: ${nums[i]}/5`).join("\n");
      return [
        { heading: idea.name.trim() || "Untitled idea", body: or(idea.rough, "what this idea is") },
        { heading: `Total: ${total} / 45`, body: breakdown },
        { heading: "Recommendation", body: verdict },
      ];
    },
  },
  {
    id: "app",
    emoji: "📱",
    name: "App Engine",
    accent: "#2DD4BF",
    blurb: "Idea → simple app MVP plan.",
    toBuild: true,
    fields: [
      { key: "flow", label: "Core user flow (in one sentence)", type: "textarea", placeholder: "User opens it, does X, gets Y." },
      { key: "first", label: "First screen", type: "text", placeholder: "What they see on load." },
    ],
    generate: (idea, v) => [
      { heading: "Route name", body: `/${slug(idea.name)}` },
      { heading: "Core user flow", body: or(v.flow, "open → do the one thing → get the payoff") },
      { heading: "First screen", body: or(v.first, "one clear action, no clutter") },
      { heading: "Must-have features", body: "1. The single core action\n2. A place to see the result\n3. A way to save or share it" },
      { heading: "Do NOT build yet", body: "Accounts, settings, payments, admin panels, extra pages, AI until the core loop is proven." },
      { heading: "3-day build", body: `Static ${'/' + slug(idea.name)} page + local state for the one core action. No backend.` },
      { heading: "10-day build", body: "Add persistence, share/export, and one round of real-user feedback baked in." },
    ],
  },
  {
    id: "money",
    emoji: "💰",
    name: "Money Engine",
    accent: "#34D399",
    blurb: "Idea → a real revenue path.",
    fields: [
      { key: "offer", label: "The offer", type: "textarea", placeholder: "What exactly do they get?" },
      { key: "price", label: "Price range", type: "text", placeholder: "$0 free / $9 / $29 …" },
    ],
    generate: (idea, v) => [
      { heading: "Possible customer", body: or(idea.who, "who would actually pay or adopt") },
      { heading: "Offer", body: or(v.offer, "the specific thing they get") },
      { heading: "Price range", body: or(v.price, "a small, honest starting price") },
      { heading: "Free lead magnet", body: "A tiny free version or template that shows the value in 60 seconds." },
      { heading: "Landing page angle", body: `"${or(idea.why, "the pain")}" → here's the simple fix.` },
      { heading: "First sale / test path", body: "Share with 10 real people who have the problem. One yes = signal. Zero = change the offer, not the price." },
    ],
  },
  {
    id: "story",
    emoji: "📖",
    name: "Story / Book Engine",
    accent: "#C084FC",
    blurb: "Hopeful idea → book / script outline.",
    fields: [
      { key: "audience", label: "Who it's for", type: "text", placeholder: "Kids, families, teens…" },
      { key: "hook", label: "Emotional hook", type: "textarea", placeholder: "What feeling pulls them in?" },
    ],
    generate: (idea, v) => [
      { heading: "Title ideas", body: `• ${idea.name.trim() || "(working title)"}\n• The ${slug(idea.name).split("-")[0] || "one"} that mattered\n• (add two of your own)` },
      { heading: "Premise", body: or(idea.rough, "one sentence: who wants what, and what's in the way") },
      { heading: "Audience", body: or(v.audience, "the specific reader") },
      { heading: "Outline", body: "Beginning — meet them in an ordinary moment.\nMiddle — the honest struggle, no shortcuts.\nEnd — earned hope and a clear, happy resolution." },
      { heading: "Emotional hook", body: or(v.hook, "the feeling that pulls a reader in") },
      { heading: "Ending promise", body: "The reader closes it feeling lighter and more hopeful than they opened it." },
      { heading: "Editing checklist", body: "☐ A human read it end to end\n☐ Nothing copies a real brand or author's style\n☐ Family-safe and kind\n☐ The ending keeps its promise" },
    ],
    guardrail: "Guardrail: human edit required · no spam publishing · no copying protected brands or styles · keep it wholesome.",
  },
  {
    id: "music",
    emoji: "🎵",
    name: "Music Engine",
    accent: "#F472B6",
    blurb: "Music idea → concept & structure.",
    fields: [
      { key: "mood", label: "Mood", type: "text", placeholder: "Hopeful, driving, tender…" },
      { key: "theme", label: "Theme", type: "textarea", placeholder: "What's the song really about?" },
    ],
    generate: (idea, v) => [
      { heading: "Song idea", body: or(idea.rough, idea.name || "the core image or line") },
      { heading: "Theme", body: or(v.theme, "the one true thing the song is about") },
      { heading: "Structure", body: "Intro · Verse 1 · Chorus · Verse 2 · Chorus · Bridge · Final chorus" },
      { heading: "Mood", body: or(v.mood, "the feeling from first note to last") },
      { heading: "Hook ideas", body: "• One line anyone can sing back after one listen\n• Keep it short, concrete, and honest" },
      { heading: "Production direction", body: "Start sparse, build to the final chorus, leave space. Serve the lyric, not the plugins." },
    ],
    guardrail: "Guardrail: no copying artists · no imitating copyrighted lyrics · make it your own.",
  },
  {
    id: "stock",
    emoji: "📈",
    name: "StockTracker Engine",
    accent: "#FBBF24",
    blurb: "Market learning & risk journal.",
    fields: [
      { key: "ticker", label: "Watchlist idea / ticker", type: "text", placeholder: "A company or theme to learn about." },
      { key: "thesis", label: "Your thesis (in plain words)", type: "textarea", placeholder: "Why is this interesting to watch?" },
    ],
    generate: (idea, v) => [
      { heading: "Watchlist idea", body: or(v.ticker, idea.name || "the company or theme to follow") },
      { heading: "What to track", body: "• Price vs. your own note from last week\n• One real fundamental (revenue, users, margins)\n• The story you keep telling yourself about it" },
      { heading: "Risk questions", body: "• What would prove me wrong?\n• How much would I be fine losing?\n• Am I reacting to news or to my plan?" },
      { heading: "Thesis journal", body: or(v.thesis, "why this is worth watching — dated, in your own words") },
      { heading: "What changed today", body: "(Write one line each day. Facts, not feelings.)" },
      { heading: "⚠️ Education disclaimer", body: "This is a learning journal only. Not financial advice. No buy/sell or options signals. No guaranteed returns. Do your own research." },
    ],
    guardrail: "Guardrail: education only · no financial advice · no trade signals · no return promises.",
  },
  {
    id: "agent",
    emoji: "🤖",
    name: "Agent Engine",
    accent: "#E879F9",
    blurb: "Idea → small-business AI agent concept.",
    toBuild: true,
    fields: [
      { key: "business", label: "Target business", type: "text", placeholder: "Dentist, gym, food truck…" },
      { key: "workflow", label: "Workflow to automate", type: "textarea", placeholder: "The boring, repeatable task." },
    ],
    generate: (idea, v) => [
      { heading: "Target business", body: or(v.business, idea.who || "the specific small business") },
      { heading: "Workflow automated", body: or(v.workflow, "the repeatable task that eats their time") },
      { heading: "First agent behavior", body: "Do ONE step of that workflow reliably, start to finish, before adding anything." },
      { heading: "Inputs needed", body: "The minimum info the agent needs each run — nothing sensitive it doesn't need." },
      { heading: "Output / deliverable", body: "A finished thing a human can use immediately (draft, summary, list, reply)." },
      { heading: "Demo version", body: "One button, paste in real input, see a real result. No login." },
      { heading: "Privacy / risk notes", body: "Say what data it touches, keep it minimal, and keep a human in the loop for anything that goes out." },
    ],
    guardrail: "Guardrail: keep a human in the loop · minimize data collected · be clear about what it touches.",
  },
];

// ---- UI helpers ---------------------------------------------------
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", background: "var(--surface)",
  border: "1px solid var(--line2)", borderRadius: 12, color: "var(--text)",
  padding: "12px 13px", fontSize: 16, fontFamily: "inherit",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 7 };

function ScoreRow({ label, value, onChange, tint }: { label: string; value: number; onChange: (n: number) => void; tint: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: 7 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label}: ${n}`}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10, cursor: "pointer", fontWeight: 900, fontSize: 15,
              border: `1px solid ${n <= value ? tint : "var(--line2)"}`,
              background: n <= value ? tint : "transparent",
              color: n <= value ? "var(--bg)" : "var(--muted)",
              touchAction: "manipulation",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EngineRoom() {
  const [idea, setIdea] = useState<Idea>(emptyIdea);
  const [active, setActive] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
  const [output, setOutput] = useState<Section[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.idea) setIdea({ ...emptyIdea, ...p.idea });
        if (p.inputs) setInputs(p.inputs);
      }
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE, JSON.stringify({ idea, inputs })); } catch { /* ignore */ }
  }, [idea, inputs, ready]);

  const engine = ENGINES.find((e) => e.id === active) || null;
  const eInputs = (id: string) => inputs[id] || {};
  const setEInput = (id: string, key: string, val: string) =>
    setInputs((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }));

  const run = () => {
    if (!engine) return;
    setOutput(engine.generate(idea, eInputs(engine.id)));
    setCopied(false);
  };
  const openEngine = (id: string) => { setActive(id); setOutput(null); setCopied(false); };
  const back = () => { setActive(null); setOutput(null); };

  const copyOut = async () => {
    if (!output || !engine) return;
    const md = `# ${engine.name} — Step In The Ring\n\n` +
      output.map((s) => `## ${s.heading}\n${s.body}`).join("\n\n");
    try { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ }
  };

  return (
    <main>
      <div className="page">
        <header style={{ textAlign: "center", marginBottom: 26 }}>
          <a href="https://stepinthering.com" className="kicker" style={{ textDecoration: "none" }}>Step In The Ring</a>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🧰</div>
          <h1 style={{ fontSize: "clamp(1.9rem, 8vw, 2.6rem)", fontWeight: 900, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.05 }}>
            Engine <span style={{ color: "var(--gold)" }}>Room</span>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 460, margin: "0 auto" }}>
            Turn a rough idea into something usable — a product card, plan, or outline. Then take it to the ring and build it.
          </p>
        </header>

        {/* Rough idea seed — feeds every engine */}
        <section className="card" style={{ borderLeft: "4px solid var(--gold)", marginBottom: 24 }}>
          <span className="kicker" style={{ marginBottom: 14 }}>Start with a rough idea</span>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Idea name</label>
            <input style={inputStyle} value={idea.name} onChange={(e) => setIdea({ ...idea, name: e.target.value })} placeholder="Give it a working name" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Rough thought</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={idea.rough} onChange={(e) => setIdea({ ...idea, rough: e.target.value })} placeholder="Say it however it comes out." />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Who it helps</label>
            <input style={inputStyle} value={idea.who} onChange={(e) => setIdea({ ...idea, who: e.target.value })} placeholder="The specific person." />
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={labelStyle}>Why it matters</label>
            <input style={inputStyle} value={idea.why} onChange={(e) => setIdea({ ...idea, why: e.target.value })} placeholder="The real problem or moment." />
          </div>
        </section>

        {!engine && (
          <>
            <span className="kicker" style={{ textAlign: "center" }}>Pick an engine</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginTop: 6 }}>
              {ENGINES.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => openEngine(e.id)}
                  style={{
                    textAlign: "left", cursor: "pointer", background: "var(--panel)", border: "1px solid var(--line)",
                    borderLeft: `4px solid ${e.accent}`, borderRadius: 16, padding: "16px 15px",
                    display: "flex", flexDirection: "column", gap: 6, minHeight: 110, touchAction: "manipulation",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{e.emoji}</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>{e.name}</span>
                  <span style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.4 }}>{e.blurb}</span>
                </button>
              ))}
            </div>
            <div className="divider" />
            <div style={{ textAlign: "center" }}>
              <a href="/build" className="btn btn-gold">🥊 Ready to build? Step in the ring</a>
            </div>
          </>
        )}

        {engine && (
          <section>
            <button type="button" onClick={back} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>
              ← All engines
            </button>
            <div className="card" style={{ borderLeft: `4px solid ${engine.accent}` }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", margin: "0 0 4px" }}>{engine.emoji} {engine.name}</h2>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 18px" }}>{engine.blurb}</p>

              {engine.fields.map((f) =>
                f.type === "score" ? (
                  <ScoreRow
                    key={f.key}
                    label={f.label}
                    tint={engine.accent}
                    value={parseInt(eInputs(engine.id)[f.key] || "3", 10)}
                    onChange={(n) => setEInput(engine.id, f.key, String(n))}
                  />
                ) : (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea style={{ ...inputStyle, minHeight: 66, resize: "vertical" }} value={eInputs(engine.id)[f.key] || ""} onChange={(e) => setEInput(engine.id, f.key, e.target.value)} placeholder={f.placeholder} />
                    ) : (
                      <input style={inputStyle} value={eInputs(engine.id)[f.key] || ""} onChange={(e) => setEInput(engine.id, f.key, e.target.value)} placeholder={f.placeholder} />
                    )}
                  </div>
                )
              )}

              <button type="button" onClick={run} className="btn btn-gold" style={{ width: "100%", marginTop: 4, background: engine.accent }}>
                Run {engine.name} →
              </button>
              {engine.guardrail && (
                <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "12px 0 0", lineHeight: 1.5 }}>{engine.guardrail}</p>
              )}
            </div>

            {output && (
              <div className="card" style={{ marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10 }}>
                  <span className="kicker" style={{ margin: 0 }}>Result</span>
                  <button type="button" onClick={copyOut} className="btn btn-small" style={{ background: copied ? engine.accent : "transparent", color: copied ? "var(--bg)" : "var(--text)", border: `1px solid ${engine.accent}` }}>
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                {output.map((s, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>{s.heading}</div>
                    <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.body}</div>
                  </div>
                ))}
                {engine.toBuild && (
                  <a href="/build" className="btn btn-gold" style={{ width: "100%", marginTop: 6 }}>🥊 Now build it → Step in the ring</a>
                )}
              </div>
            )}
          </section>
        )}

        <p style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "center", margin: "30px 0 0", lineHeight: 1.6 }}>
          Everything stays on this device. Nothing is sent anywhere. Deterministic templates — your words, structured.
        </p>
      </div>
    </main>
  );
}
