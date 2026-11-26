"use client";

// Creative Ring, one challenge page (owner direction, Nov 25 2026):
// watch it, understand it, try it, record a try if you like, repeat it,
// see your progress, and share it if you want to.
//
// The mechanics are the original Heisman's (./engine, from iDontCry):
// left side then right side, a get-ready count, a clock, one big button that
// counts touch-downs, a 1-to-5 "how steady" rating, and one stated rule for
// which side was steadier. Tries are saved on this device only.
//
// Recording is OFF until the person switches it on. The camera video stays in
// this browser: nothing is uploaded, nothing is sent, and it's gone when the
// page closes unless they save it. Sharing is only ever their own choice.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearTries, compareSides, fillSide, heldSeconds, loadPrefs, loadTries, otherSide, saveTry, savePrefs, secs, sinceFirst, verdictLine,
  type Prefs, type SideResult, type Try,
} from "./engine/core";
import { PoseFigure } from "./engine/PoseFigure";
import type { Side, TwoSidesChallenge } from "./engine/types";

type Phase = "ready" | "countdown" | "hold" | "rate" | "done";
const GET_READY = 5;

function beep(on: boolean, high = false) {
  if (!on) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = high ? 880 : 520;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
    osc.onended = () => ctx.close();
  } catch {
    /* no sound, no problem */
  }
}

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const t of ["video/mp4", "video/webm;codecs=vp9", "video/webm"]) {
    if (MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return undefined;
}

/** Draw a plain result card (no names, no faces) and return it as a PNG file. */
async function resultCard(c: TwoSidesChallenge, t: Try): Promise<File | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#0b1220";
  g.fillRect(0, 0, 1080, 1350);
  g.fillStyle = "#2BA6FF";
  g.font = "700 40px sans-serif";
  g.fillText("CREATIVE RING", 90, 170);
  g.fillStyle = "#e8edf5";
  g.font = "900 96px sans-serif";
  g.fillText(c.title, 90, 290);
  const v = compareSides(t.left, t.right);
  const rows: [string, SideResult][] = [["Left side", t.left], ["Right side", t.right]];
  rows.forEach(([label, r], i) => {
    const y = 450 + i * 250;
    g.fillStyle = "#141d2e";
    g.fillRect(90, y, 900, 200);
    g.fillStyle = v.steadier === (i === 0 ? "left" : "right") ? "#2BA6FF" : "#94a3b8";
    g.font = "700 40px sans-serif";
    g.fillText(label, 130, y + 70);
    g.fillStyle = "#e8edf5";
    g.font = "900 72px sans-serif";
    g.fillText(`${secs(heldSeconds(r))} s held`, 130, y + 160);
    g.fillStyle = "#94a3b8";
    g.font = "600 36px sans-serif";
    const n = r.taps.length;
    g.fillText(`${n} ${n === 1 ? c.slip.singular : c.slip.plural}`, 640, y + 155);
  });
  g.fillStyle = "#e8edf5";
  g.font = "600 38px sans-serif";
  const words = verdictLine(v, c).split(" ");
  let line = "";
  let y = 1010;
  for (const w of words) {
    if (g.measureText(`${line}${w} `).width > 900) { g.fillText(line.trim(), 90, y); line = ""; y += 52; }
    line += `${w} `;
  }
  g.fillText(line.trim(), 90, y);
  g.fillStyle = "#94a3b8";
  g.font = "600 32px sans-serif";
  g.fillText(`${t.hold}-second hold · ${t.version}`, 90, 1220);
  g.fillText("stepinthering.com/ring", 90, 1270);
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
  return blob ? new File([blob], `${c.id}-result.png`, { type: "image/png" }) : null;
}

async function shareOrSave(file: File, title: string) {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return;
    } catch {
      /* cancelled: fall through to saving */
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export default function RingChallenge({ challenge: c }: { challenge: TwoSidesChallenge }) {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(c, null));
  const [tries, setTries] = useState<Try[]>([]);
  const [demoSide, setDemoSide] = useState<Side>("left");
  const [phase, setPhase] = useState<Phase>("ready");
  const [side, setSide] = useState<Side>("left");
  const [count, setCount] = useState(GET_READY);
  const [left, setLeft] = useState(0);
  const [taps, setTaps] = useState<number[]>([]);
  const [results, setResults] = useState<Partial<Record<Side, SideResult>>>({});
  const [lastTry, setLastTry] = useState<Try | null>(null);
  const [record, setRecord] = useState(false);
  const [camError, setCamError] = useState("");
  const [clips, setClips] = useState<Partial<Record<Side, string>>>({});
  const goAt = useRef(0);
  const timer = useRef<number | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const live = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Same as the original: a client-only localStorage read after the first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only localStorage read
    setPrefs(loadPrefs(c));
    setTries(loadTries(c.id));
  }, [c]);

  const choose = (p: Partial<Prefs>) => setPrefs((cur) => { const next = { ...cur, ...p }; savePrefs(c.id, next); return next; });

  const stopTimer = () => { if (timer.current !== null) { window.clearInterval(timer.current); timer.current = null; } };

  const stopCamera = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  useEffect(() => () => { stopTimer(); stopCamera(); }, [stopCamera]);

  const toggleRecord = async (on: boolean) => {
    setCamError("");
    if (!on) { setRecord(false); stopCamera(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !pickMime()) {
      setCamError("Recording isn't available in this browser. Everything else works.");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setRecord(true);
      window.setTimeout(() => { if (live.current && stream.current) { live.current.srcObject = stream.current; void live.current.play().catch(() => {}); } }, 50);
    } catch {
      setCamError("The camera wasn't allowed, so this try won't be recorded. Everything else works.");
      setRecord(false);
    }
  };

  const startRecording = () => {
    if (!record || !stream.current) return;
    const mime = pickMime();
    try {
      chunks.current = [];
      const rec = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
      rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      const thisSide = side;
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: mime || "video/webm" });
        setClips((cur) => ({ ...cur, [thisSide]: URL.createObjectURL(blob) }));
      };
      rec.start();
      recorder.current = rec;
    } catch {
      setCamError("That try couldn't be recorded. Everything else works.");
    }
  };

  const finishHold = useCallback(() => {
    stopTimer();
    if (recorder.current?.state === "recording") recorder.current.stop();
    beep(prefs.sound, true);
    setPhase("rate");
  }, [prefs.sound]);

  const start = () => {
    setTaps([]);
    setCount(GET_READY);
    setPhase("countdown");
    startRecording();
    let n = GET_READY;
    stopTimer();
    timer.current = window.setInterval(() => {
      n -= 1;
      if (n <= 3 && n > 0) beep(prefs.sound);
      if (n <= 0) {
        stopTimer();
        beep(prefs.sound, true);
        goAt.current = performance.now();
        setLeft(prefs.hold);
        setPhase("hold");
        timer.current = window.setInterval(() => {
          const gone = (performance.now() - goAt.current) / 1000;
          const remain = Math.max(0, prefs.hold - gone);
          setLeft(remain);
          if (remain <= 0) finishHold();
        }, 100);
        return;
      }
      setCount(n);
    }, 1000);
  };

  const touch = () => {
    if (phase !== "hold") return;
    setTaps((t) => [...t, Math.round(performance.now() - goAt.current)]);
    navigator.vibrate?.(30);
  };

  const rate = (feel: number) => {
    const r: SideResult = { hold: prefs.hold, taps, feel };
    const next = { ...results, [side]: r };
    setResults(next);
    const other = otherSide(side);
    if (!next[other]) {
      setSide(other);
      setPhase("ready");
      return;
    }
    const t: Try = { at: new Date().toISOString(), version: prefs.version, hold: prefs.hold, first: prefs.first, left: next.left!, right: next.right! };
    setTries(saveTry(c.id, t));
    setLastTry(t);
    setPhase("done");
    stopCamera();
    setRecord(false);
  };

  const redo = () => { setTaps([]); setPhase("ready"); };

  const again = () => {
    setResults({});
    setLastTry(null);
    setSide(prefs.first);
    setPhase("ready");
    setClips({});
    document.getElementById("try")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const steps = c.versions[prefs.version].steps;
  const verdict = lastTry ? compareSides(lastTry.left, lastTry.right) : null;
  const weaker: Side | null = verdict && verdict.steadier ? otherSide(verdict.steadier) : null;
  const progress = useMemo(() => sinceFirst(tries), [tries]);
  const recent = tries.slice(-8);

  return (
    <div className="rg">
      {/* 1 · Watch */}
      <section className="rg-sec" aria-labelledby="watch-h">
        <span className="rg-num">1</span>
        <h2 id="watch-h">Watch it</h2>
        <div className="rg-demo">
          <PoseFigure challenge={c} version={prefs.version} side={demoSide} motion="loop" label={`An animated figure doing the pose on the ${demoSide} side`} />
          <p className="rg-cap">{fillSide(c.caption, demoSide)}</p>
          <div className="rg-toggle" role="group" aria-label="Which side to show">
            {(["left", "right"] as Side[]).map((s) => (
              <button key={s} type="button" aria-pressed={demoSide === s} onClick={() => setDemoSide(s)}>Show {s} side</button>
            ))}
          </div>
          <p className="rg-note">Our own animated drawing. No clip of a real person is used.</p>
        </div>
      </section>

      {/* 2 · Understand */}
      <section className="rg-sec" aria-labelledby="how-h">
        <span className="rg-num">2</span>
        <h2 id="how-h">How to do it</h2>
        <p>{c.why}</p>
        <div className="rg-toggle" role="group" aria-label="Standing or seated">
          {(["standing", "seated"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={prefs.version === v} onClick={() => choose({ version: v })}>{c.versions[v].label}</button>
          ))}
        </div>
        <p className="rg-note">{c.versions[prefs.version].note}</p>
        <ol className="rg-steps">{steps.map((s) => <li key={s}>{fillSide(s, demoSide)}</li>)}</ol>
        <ul className="rg-safety">{c.safety.map((s) => <li key={s}>{s}</li>)}</ul>
      </section>

      {/* 3 · Try (and record, if you choose) */}
      <section id="try" className="rg-sec rg-try" aria-labelledby="try-h">
        <span className="rg-num">3</span>
        <h2 id="try-h">{phase === "done" ? "Try it: both sides done" : `Try it: ${side} side`}</h2>

        {phase === "ready" && (
          <>
            {!results.left && !results.right && (
              <div className="rg-setup">
                <label>Hold for
                  <select value={prefs.hold} onChange={(e) => choose({ hold: Number(e.target.value) })}>
                    {c.holdChoices.map((h) => <option key={h} value={h}>{h} seconds</option>)}
                  </select>
                </label>
                <label>Start with
                  <select value={prefs.first} onChange={(e) => { const f = e.target.value as Side; choose({ first: f }); setSide(f); }}>
                    <option value="left">Left side</option>
                    <option value="right">Right side</option>
                  </select>
                </label>
                <label className="rg-check"><input type="checkbox" checked={prefs.sound} onChange={(e) => choose({ sound: e.target.checked })} /> Beeps</label>
                <label className="rg-check"><input type="checkbox" checked={record} onChange={(e) => void toggleRecord(e.target.checked)} /> Record my try (stays on this phone)</label>
              </div>
            )}
            {camError && <p className="rg-warn" role="alert">{camError}</p>}
            {record && (
              <div className="rg-live">
                <video ref={live} muted playsInline aria-label="Camera preview" />
                <span>Recording starts with the countdown. Nothing is uploaded.</span>
              </div>
            )}
            <p className="rg-lead">{fillSide(c.caption, side)}</p>
            <p className="rg-note">{fillSide(c.slip.howTo, side)}</p>
            <button type="button" className="rg-go" onClick={start}>Start the {side} side</button>
          </>
        )}

        {phase === "countdown" && (
          <div className="rg-clock" aria-live="assertive">
            <span className="rg-big">{count}</span>
            <span>Get into the pose: {side} side</span>
          </div>
        )}

        {phase === "hold" && (
          <div className="rg-clock">
            <span className="rg-big" aria-live="off">{Math.ceil(left)}</span>
            <span>Hold it{record ? " · recording" : ""}</span>
            <button type="button" className="rg-slip" onClick={touch}>
              {c.slip.button}
              <small>{taps.length} {taps.length === 1 ? c.slip.singular : c.slip.plural}</small>
            </button>
          </div>
        )}

        {phase === "rate" && (
          <div className="rg-rate">
            <p className="rg-lead">How steady did your {side} side feel?</p>
            <div className="rg-feel">
              {c.feel.map((f, i) => (
                <button key={f} type="button" onClick={() => rate(i + 1)}><b>{i + 1}</b>{f}</button>
              ))}
            </div>
            <button type="button" className="text-link rg-linkbtn" onClick={redo}>Redo this side</button>
          </div>
        )}

        {phase === "done" && lastTry && verdict && (
          <div className="rg-result">
            <p className="rg-lead">{verdictLine(verdict, c)}</p>
            <div className="rg-sides">
              {(["left", "right"] as Side[]).map((s) => {
                const r = lastTry[s];
                return (
                  <div key={s} className="rg-side" data-best={verdict.steadier === s || undefined}>
                    <strong>{s === "left" ? "Left" : "Right"}</strong>
                    <span>{secs(heldSeconds(r))} s held</span>
                    <span>{r.taps.length} {r.taps.length === 1 ? c.slip.singular : c.slip.plural}</span>
                    <span>Felt: {r.feel ? c.feel[r.feel - 1] : "not rated"}</span>
                    {clips[s] && <video src={clips[s]} controls playsInline className="rg-clip" aria-label={`Your recorded ${s} side`} />}
                    {clips[s] && (
                      <button type="button" className="btn btn-ghost btn-small" onClick={async () => {
                        const blob = await fetch(clips[s]!).then((x) => x.blob());
                        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
                        await shareOrSave(new File([blob], `${c.id}-${s}.${ext}`, { type: blob.type }), `${c.title}, ${s} side`);
                      }}>Save or share this video</button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="rg-actions">
              <button type="button" className="rg-go" onClick={again}>Try again</button>
              <button type="button" className="btn btn-ghost" onClick={async () => { const f = await resultCard(c, lastTry); if (f) await shareOrSave(f, `${c.title} result`); }}>Share my result</button>
            </div>
            <p className="rg-note">Sharing makes a picture of your numbers, with no name and no photo. You choose where it goes; nothing is posted for you.</p>
            {weaker && (
              <div className="rg-drills">
                <h3>Practice your {weaker} side</h3>
                <ul>{c.drills.map((d) => <li key={d.title}><strong>{d.title}.</strong> {fillSide(d.text, weaker)}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4 · Progress */}
      <section className="rg-sec" aria-labelledby="progress-h">
        <span className="rg-num">4</span>
        <h2 id="progress-h">Your progress</h2>
        {tries.length === 0 ? (
          <p className="rg-note">Finish one try on both sides and it shows up here. Tries stay on this device.</p>
        ) : (
          <>
            <p>{tries.length} {tries.length === 1 ? "try" : "tries"} on this device.</p>
            {progress && (
              <p className="rg-lead">
                Since your first {progress.last.hold}-second {progress.last.version} try: left {secs(heldSeconds(progress.first.left))} → {secs(heldSeconds(progress.last.left))} s,
                right {secs(heldSeconds(progress.first.right))} → {secs(heldSeconds(progress.last.right))} s.
              </p>
            )}
            <ProgressChart tries={recent} />
            <button type="button" className="text-link rg-linkbtn" onClick={() => { if (window.confirm("Clear every saved try on this device?")) { clearTries(c.id); setTries([]); } }}>Clear my tries</button>
          </>
        )}
      </section>

      {/* 5 · The honest part */}
      <section className="rg-sec" aria-labelledby="numbers-h">
        <span className="rg-num">5</span>
        <h2 id="numbers-h">What the numbers mean</h2>
        <ul className="rg-plain">{c.measures.map((m) => <li key={m}>{m}</li>)}</ul>
        <ul className="rg-plain rg-muted">
          {c.limits.map((m) => <li key={m}>{m.replace("No camera and no motion sensors are used", "The camera is used only if you switch on recording, and only to record; it doesn't measure anything")}</li>)}
        </ul>
        <p className="rg-note"><Link href="/ring">All rings</Link></p>
      </section>
    </div>
  );
}

/** Held seconds per side for the last few tries. Plain bars, no library. */
function ProgressChart({ tries }: { tries: Try[] }) {
  const max = Math.max(...tries.map((t) => t.hold), 1);
  return (
    <div className="rg-chart" role="img" aria-label="Seconds held on each side for your recent tries">
      {tries.map((t, i) => (
        <div key={t.at} className="rg-col">
          <span className="rg-bar rg-l" style={{ height: `${(heldSeconds(t.left) / max) * 100}%` }} />
          <span className="rg-bar rg-r" style={{ height: `${(heldSeconds(t.right) / max) * 100}%` }} />
          <small>{i + 1}</small>
        </div>
      ))}
      <p className="rg-legend"><span className="rg-key rg-l" /> left <span className="rg-key rg-r" /> right</p>
    </div>
  );
}
