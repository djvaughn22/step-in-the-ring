"use client";

// Courtesy gate around the Engine Room while it is being built.
// Client-side only — keeps casual visitors and search engines out of
// unfinished engines. It is not a security boundary and stores no
// personal information.

import { useEffect, useState } from "react";
import { grantAccess, hasAccess } from "./access";
import { track } from "../lib/analytics";

const REQUEST_MAILTO = `mailto:ask@openmirrorllc.com?subject=${encodeURIComponent(
  "Engine Room access request",
)}&body=${encodeURIComponent(
  "I'd like access to the StepInTheRing Engine Room.\n\nName (optional):\nWhat do you want to make?\n",
)}`;

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllowed(hasAccess());
    setReady(true);
  }, []);

  const submit = () => {
    if (grantAccess(code)) {
      track("gate_unlocked", {});
      setAllowed(true);
      setError("");
    } else {
      setError("That code is not valid.");
    }
  };

  if (!ready) return <div className="page"><div style={{ height: 200 }} /></div>;
  if (allowed) return <>{children}</>;

  return (
    <main>
      <div className="page" style={{ maxWidth: 480 }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 24, marginTop: 40 }}>
          <p className="kicker" style={{ margin: "0 0 8px" }}>Step In The Ring</p>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: "0 0 10px" }}>
            The Engine Room is in a private build phase.
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 18px" }}>
            Access is by request while the engines are being finished. Request access by email and you&apos;ll get a code back.
          </p>

          <a href={REQUEST_MAILTO} className="btn btn-gold" style={{ display: "block", textAlign: "center", marginBottom: 18 }}>
            Request access by email
          </a>

          <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
            Already have a code?
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Access code"
              aria-label="Access code"
              style={{ flex: 1, boxSizing: "border-box", background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)", padding: "11px 12px", fontSize: 15, fontFamily: "inherit" }}
            />
            <button onClick={submit} className="btn btn-gold btn-small">Enter</button>
          </div>
          {error && <p style={{ fontSize: 13, color: "var(--gold)", fontWeight: 700, margin: "8px 0 0" }}>{error}</p>}

          <p style={{ fontSize: 12, color: "var(--muted)", margin: "18px 0 0", lineHeight: 1.5 }}>
            No account is created and nothing is tracked. The code is remembered on this device only.
          </p>
        </div>
      </div>
    </main>
  );
}
