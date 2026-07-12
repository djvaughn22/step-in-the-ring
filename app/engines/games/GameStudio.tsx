"use client";

/**
 * Game Studio — the Game Engine's specialized UI.
 *
 * Flow: pick a platform mode → pick a proven template → shape your world →
 * play the live preview → publish (a real deploy to opendoku.com).
 * This is the reference pipeline for every future platform mode.
 */

import { useEffect, useState } from "react";
import {
  GAME_MODES, MINEDOKU_WORLD, slugFromName,
  validateWorld, type DokuWorld, type GameMode, type GameTemplate,
} from "./game-modes";
import { canPublish, PRIVILEGE_NOTE } from "./privileges";

const DRAFT_KEY = "sitr-game-world-v1";

type Step = "mode" | "template" | "world" | "launchpad";

export default function GameStudio({ onBack, card }: { onBack: () => void; card: React.CSSProperties }) {
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<GameMode | null>(null);
  const [template, setTemplate] = useState<GameTemplate | null>(null);
  const [world, setWorld] = useState<DokuWorld>(MINEDOKU_WORLD);
  const [slugTouched, setSlugTouched] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [busy, setBusy] = useState("");
  const [publishResult, setPublishResult] = useState<{ url: string; commit: string; updated: boolean } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWorld(JSON.parse(raw));
        setSlugTouched(true);
      }
    } catch {}
  }, []);

  const saveWorld = (w: DokuWorld) => {
    setWorld(w);
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(w)); } catch {}
  };

  const patch = (p: Partial<DokuWorld>) => {
    const w = { ...world, ...p };
    if (p.name !== undefined && !slugTouched) w.slug = slugFromName(p.name);
    saveWorld(w);
  };

  const input = { width: "100%", boxSizing: "border-box" as const, background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)", padding: "10px 12px", fontSize: 15, fontFamily: "inherit" };
  const label = { display: "block", fontSize: 13, fontWeight: 800, color: "var(--text)", margin: "12px 0 4px" } as const;
  const kicker = { fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: "0.1em" };
  const dim = { fontSize: 13, color: "var(--muted)", lineHeight: 1.55 } as const;

  const api = async (action: "preview" | "publish", overwrite = false) => {
    setError(""); setBusy(action === "preview" ? "Building your game…" : "Publishing to opendoku.com…");
    try {
      const res = await fetch("/api/engines/games/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, modeId: mode?.id, templateId: template?.id, world, overwrite }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && action === "publish" && confirm(data.error + "\n\nUpdate the live game?")) {
          setBusy("");
          return api("publish", true);
        }
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      if (action === "preview") setPreviewHtml(data.html);
      else setPublishResult({ url: data.url, commit: data.commit, updated: data.updated });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  };

  const errors = validateWorld(world);

  return (
    <main>
      <div className="page">
        <header style={{ textAlign: "center", marginBottom: 20 }}>
          <span className="kicker">Engine Room</span>
          <h1 style={{ fontSize: "clamp(1.8rem,7vw,2.4rem)", fontWeight: 900, color: "var(--text)", margin: "6px 0 6px", lineHeight: 1.05 }}>
            🎮 Game <span style={{ color: "var(--gold)" }}>Engine</span>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 520, margin: "0 auto" }}>
            Pick a platform, shape a world on a proven game, play it right here, then publish it live.
            Dreams start on iDontCry, get built here, and land on the platform for real.
          </p>
        </header>

        {/* ---------- STEP: MODE ---------- */}
        {step === "mode" && (
          <>
            <button onClick={onBack} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Engines</button>
            <span className="kicker">1 · Choose a platform</span>
            {GAME_MODES.map((m) => (
              <button
                key={m.id}
                disabled={m.status !== "live"}
                onClick={() => { setMode(m); setStep("template"); }}
                style={{ ...card, width: "100%", textAlign: "left", cursor: m.status === "live" ? "pointer" : "default", borderLeft: "4px solid var(--gold)", marginTop: 10, opacity: m.status === "live" ? 1 : 0.55 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>{m.emoji} {m.name}</span>
                  <span style={{ ...kicker, border: "1px solid var(--line2)", borderRadius: 50, padding: "2px 8px", fontSize: 10 }}>
                    {m.status === "live" ? "Live" : "Planned"}
                  </span>
                </div>
                <p style={{ ...dim, margin: "6px 0 0" }}>{m.blurb}</p>
                <p style={{ ...dim, margin: "4px 0 0", fontWeight: 800, color: "var(--gold)", fontSize: 12 }}>→ {m.platform}</p>
              </button>
            ))}
          </>
        )}

        {/* ---------- STEP: TEMPLATE ---------- */}
        {step === "template" && mode && (
          <>
            <button onClick={() => setStep("mode")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Platforms</button>
            <span className="kicker">2 · Choose a game template</span>
            {mode.templates.map((t) => (
              <button key={t.id} onClick={() => { setTemplate(t); setStep("world"); }} style={{ ...card, width: "100%", textAlign: "left", cursor: "pointer", borderLeft: "4px solid var(--gold)", marginTop: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>{t.emoji} {t.name}</span>
                <p style={{ ...dim, margin: "6px 0 0" }}>{t.blurb}</p>
              </button>
            ))}
            <p style={{ ...dim, marginTop: 12 }}>
              Templates are complete, tested games that live in the platform&apos;s repo. Your world re-themes one —
              the math and the fun are already proven.
            </p>
          </>
        )}

        {/* ---------- STEP: WORLD ---------- */}
        {step === "world" && mode && template && (
          <>
            <button onClick={() => setStep("template")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Templates</button>
            <div style={card}>
              <span style={kicker}>3 · Shape your world</span>
              <p style={{ ...dim, margin: "6px 0 0" }}>
                The template sets the puzzle math. The words, emoji, and colors are yours.
                Prefilled: <b>MineDoku</b>, the {template.name} home world.
              </p>

              <label style={label}>Game name</label>
              <input style={input} value={world.name} onChange={(e) => patch({ name: e.target.value })} />
              <label style={label}>Web address (opendoku.com/…)</label>
              <input style={input} value={world.slug} onChange={(e) => { setSlugTouched(true); patch({ slug: e.target.value.toLowerCase() }); }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={label}>Game emoji</label>
                  <input style={input} value={world.emoji} onChange={(e) => patch({ emoji: e.target.value })} />
                </div>
                <div>
                  <label style={label}>Treasure emoji</label>
                  <input style={input} value={world.gem} onChange={(e) => patch({ gem: e.target.value })} />
                </div>
              </div>
              <label style={label}>Tagline (one line)</label>
              <input style={input} value={world.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
              <label style={label}>Rule line (under the tagline)</label>
              <input style={input} value={world.sub} onChange={(e) => patch({ sub: e.target.value })} />
              <label style={label}>opendoku.com homepage card blurb</label>
              <textarea style={{ ...input, minHeight: 60, resize: "vertical" }} value={world.cardBlurb} onChange={(e) => patch({ cardBlurb: e.target.value })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={label}>Accent (dark mode)</label>
                  <input style={input} value={world.accentDark} onChange={(e) => patch({ accentDark: e.target.value })} />
                </div>
                <div>
                  <label style={label}>Accent (light mode)</label>
                  <input style={input} value={world.accentLight} onChange={(e) => patch({ accentLight: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ ...card, marginTop: 12 }}>
              <span style={kicker}>Tier names</span>
              {world.tiers.map((t, i) => (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 8, marginTop: 8 }}>
                  <input style={input} value={t.emoji} onChange={(e) => { const tiers = [...world.tiers]; tiers[i] = { ...t, emoji: e.target.value }; patch({ tiers }); }} />
                  <input style={input} value={t.name} onChange={(e) => { const tiers = [...world.tiers]; tiers[i] = { ...t, name: e.target.value }; patch({ tiers }); }} />
                  <span style={{ ...dim, gridColumn: "1 / -1", fontSize: 12 }}>{t.size}×{t.size} · {t.blurb}</span>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 8, marginTop: 14 }}>
                <input style={input} value={world.memory.emoji} onChange={(e) => patch({ memory: { ...world.memory, emoji: e.target.value } })} />
                <input style={input} value={world.memory.name} onChange={(e) => patch({ memory: { ...world.memory, name: e.target.value } })} />
                <span style={{ ...dim, gridColumn: "1 / -1", fontSize: 12 }}>Memory mode · {world.memory.blurb}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 8, marginTop: 8 }}>
                <input style={input} value={world.danger.emoji} onChange={(e) => patch({ danger: { ...world.danger, emoji: e.target.value } })} />
                <input style={input} value={world.danger.name} onChange={(e) => patch({ danger: { ...world.danger, name: e.target.value } })} />
                <span style={{ ...dim, gridColumn: "1 / -1", fontSize: 12 }}>Danger mode · {world.danger.blurb}</span>
              </div>
            </div>

            {errors.length > 0 && (
              <div style={{ ...card, marginTop: 12, borderColor: "#b45309" }}>
                {errors.map((e) => <p key={e} style={{ ...dim, color: "var(--text)", margin: "4px 0" }}>⚠ {e}</p>)}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => { saveWorld(MINEDOKU_WORLD); setSlugTouched(false); }} className="btn btn-ghost btn-small">Reset to MineDoku</button>
              <button
                disabled={errors.length > 0}
                onClick={() => { setPreviewHtml(""); setPublishResult(null); setStep("launchpad"); api("preview"); }}
                className="btn btn-gold"
                style={{ flex: 1 }}
              >
                Play it → launchpad
              </button>
            </div>
          </>
        )}

        {/* ---------- STEP: LAUNCHPAD ---------- */}
        {step === "launchpad" && mode && template && (
          <>
            <button onClick={() => setStep("world")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Edit world</button>
            <div style={card}>
              <span style={kicker}>4 · Launchpad — {world.emoji} {world.name}</span>
              <p style={{ ...dim, margin: "6px 0 10px" }}>
                This is the real game, playable now. Publishing pushes it to <b>{mode.platform}/{world.slug}/</b> — a live production deploy.
              </p>
              {busy && <p style={{ color: "var(--gold)", fontWeight: 800 }}>{busy}</p>}
              {error && <p style={{ color: "#f87171", fontSize: 13.5, lineHeight: 1.5 }}>⚠ {error}</p>}
              {previewHtml && (
                <iframe
                  title={`${world.name} preview`}
                  srcDoc={previewHtml}
                  style={{ width: "100%", height: 620, border: "1px solid var(--line2)", borderRadius: 12, background: "#0b1220" }}
                />
              )}
              {!previewHtml && !busy && (
                <button onClick={() => api("preview")} className="btn btn-gold" style={{ width: "100%" }}>Build the preview</button>
              )}
            </div>

            <div style={{ ...card, marginTop: 12 }}>
              <span style={kicker}>Publish</span>
              <p style={{ ...dim, margin: "6px 0 10px" }}>🔓 {PRIVILEGE_NOTE}</p>
              {publishResult ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>
                    {publishResult.updated ? "Updated" : "LIVE"} — commit {publishResult.commit} pushed. Vercel is deploying it now (~1 minute).
                  </p>
                  <p style={{ margin: "10px 0 0" }}>
                    <a href={publishResult.url} target="_blank" rel="noopener noreferrer" className="btn btn-gold" style={{ textDecoration: "none" }}>
                      ▶ Play {world.name} live
                    </a>
                  </p>
                  <p style={{ ...dim, marginTop: 12 }}>
                    Next: add it to the iDontCry Game Lab so the family finds it — one line in GameLab.tsx.
                  </p>
                </>
              ) : (
                <button
                  disabled={!canPublish() || !!busy || !previewHtml}
                  onClick={() => api("publish")}
                  className="btn btn-gold"
                  style={{ width: "100%" }}
                >
                  🚀 Publish {world.name} to {mode.platform}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
