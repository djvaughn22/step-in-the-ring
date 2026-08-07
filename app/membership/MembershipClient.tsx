"use client";

// Interactive half of the membership page: the free idea capture, account
// signup/sign-in, tester-code redemption, and (when billing is live)
// server-created checkout. No entitlement decision is ever made here — the
// browser only asks the server and mirrors the answer.

import { useEffect, useState } from "react";
import { MEMBERSHIP_PRICE_LABEL } from "../members/entitlement";

type Props = {
  configured: boolean;
  billingLive: boolean;
  signedIn: boolean;
  memberAccess: boolean;
  membershipStatus: string | null;
  activeUntil: string | null;
  prefillEngine: string | null;
  prefillIdea: string | null;
  source: string | null;
  enginesHref: string;
};

const BOX: React.CSSProperties = {
  border: "1px solid rgba(148,163,184,0.25)",
  borderRadius: 14,
  padding: "16px 16px",
  marginBottom: 16,
};

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "rgba(148,163,184,0.08)",
  border: "1px solid rgba(148,163,184,0.3)",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  color: "var(--ink, #e8edf5)",
  marginBottom: 10,
};

export default function MembershipClient(props: Props) {
  const [idea, setIdea] = useState(props.prefillIdea ?? "");
  const [ideaSaved, setIdeaSaved] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Record the privacy-safe source label (e.g. build-machine) once.
  useEffect(() => {
    if (props.source) {
      fetch("/api/members/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "membership-page-visit", source: props.source }),
      }).catch(() => {});
    }
  }, [props.source]);

  // The free introduction: carry the idea into the Engine Room via the same
  // local seed the planner has always used. Local only — nothing uploads.
  function keepIdea() {
    const raw = idea.trim().slice(0, 500);
    if (!raw) return;
    try {
      window.localStorage.setItem(
        "sitr-engine-seed",
        JSON.stringify({ engineId: props.prefillEngine ?? "idea", raw }),
      );
      setIdeaSaved(true);
    } catch {
      setMessage("This browser blocked local storage — copy your idea somewhere safe instead.");
    }
  }

  async function post(path: string, body: Record<string, unknown>): Promise<{ ok: boolean; [k: string]: unknown }> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json().catch(() => ({ ok: false, error: "Something went wrong." }))) as {
      ok: boolean;
      [k: string]: unknown;
    };
  }

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const path = mode === "signup" ? "/api/members/signup" : "/api/members/login";
    const body: Record<string, unknown> = { email, password };
    if (mode === "signup" && props.source) body.source = props.source;
    const result = await post(path, body);
    setBusy(false);
    if (result.ok) window.location.reload();
    else setMessage(String(result.error ?? "That didn't work."));
  }

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await post("/api/members/tester/redeem", { code });
    setBusy(false);
    if (result.ok) window.location.href = props.enginesHref;
    else setMessage(String(result.error ?? "That code is not valid."));
  }

  async function checkout() {
    setBusy(true);
    setMessage(null);
    const result = await post("/api/members/checkout", {});
    setBusy(false);
    if (result.ok && typeof result.url === "string") window.location.assign(result.url);
    else setMessage(String(result.error ?? "Checkout is not available."));
  }

  return (
    <section aria-label="Join Step In The Ring Membership">
      {/* Free introduction — idea capture */}
      <div style={BOX}>
        <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 6px", color: "var(--ink, #e8edf5)" }}>
          Start free: capture the idea you&apos;d build
        </p>
        <p style={{ fontSize: 13, color: "var(--muted, #94a3b8)", margin: "0 0 10px", lineHeight: 1.6 }}>
          Say it however it comes out. It stays in this browser — when you
          enter the Engine Room, the right engine picks it up so you never
          retype it.
        </p>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={3}
          maxLength={500}
          style={{ ...INPUT, resize: "vertical" }}
          placeholder="e.g. A pole-vault game my kids invented that deserves a real version…"
        />
        <button type="button" className="btn btn-ghost" onClick={keepIdea} disabled={!idea.trim()}>
          {ideaSaved ? "Idea kept — it'll be waiting in the Engine Room" : "Keep this idea"}
        </button>
      </div>

      {!props.configured ? (
        <div style={BOX}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--muted, #94a3b8)", margin: 0, lineHeight: 1.6 }}>
            Accounts open with the private beta. Nothing can be created or
            purchased here yet — this page exists so the terms are public
            before anyone is asked to pay.
          </p>
        </div>
      ) : props.signedIn ? (
        <div style={BOX}>
          <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 6px", color: "var(--ink, #e8edf5)" }}>
            Your membership
          </p>
          <p style={{ fontSize: 13, color: "var(--muted, #94a3b8)", margin: "0 0 12px" }}>
            Status: <strong>{props.membershipStatus}</strong>
            {props.activeUntil ? ` · access through ${new Date(props.activeUntil).toLocaleDateString()}` : ""}
          </p>
          {props.memberAccess ? (
            <a href={props.enginesHref} className="btn btn-primary">Enter the Engine Room</a>
          ) : (
            <>
              {billingButton(props.billingLive, busy, checkout)}
              <form onSubmit={redeem} style={{ marginTop: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 800, margin: "0 0 6px", color: "var(--ink, #e8edf5)" }}>
                  Private tester code
                </p>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={INPUT}
                  placeholder="SITR-XXXX-XXXX-XXXX"
                  autoComplete="off"
                />
                <button className="btn btn-ghost" disabled={busy || !code.trim()}>Redeem code</button>
              </form>
            </>
          )}
          <p style={{ fontSize: 12, color: "var(--muted, #94a3b8)", margin: "12px 0 0" }}>
            <a href="/account" style={{ color: "var(--gold, #f59e0b)", fontWeight: 800 }}>Your account & projects →</a>
          </p>
        </div>
      ) : (
        <div style={BOX}>
          <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 10px", color: "var(--ink, #e8edf5)" }}>
            {mode === "signup" ? "Create your account" : "Sign in"}
          </p>
          <p style={{ fontSize: 12, color: "var(--muted, #94a3b8)", margin: "0 0 10px", lineHeight: 1.6 }}>
            Accounts are for an adult, parent, or other responsible purchaser.
            Only an email and password are collected.
          </p>
          <p style={{ fontSize: 12, color: "var(--muted, #94a3b8)", margin: "0 0 10px", lineHeight: 1.6 }}>
            Account recovery is not available during this private test.
            Use an email and password you can retain.
          </p>
          <form onSubmit={submitAuth}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={INPUT}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={INPUT}
              placeholder={mode === "signup" ? "Choose a password (10+ characters)" : "Password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            <button className="btn btn-primary" disabled={busy}>
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            style={{ background: "none", border: "none", padding: 0, marginTop: 10, fontSize: 12, fontWeight: 800, color: "var(--gold, #f59e0b)", cursor: "pointer" }}
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      )}

      {message && (
        <p role="alert" style={{ fontSize: 13, fontWeight: 800, color: "#fca5a5", margin: "0 0 8px" }}>
          {message}
        </p>
      )}
    </section>
  );
}

function billingButton(billingLive: boolean, busy: boolean, checkout: () => void) {
  if (!billingLive) {
    return (
      <p style={{ fontSize: 13, fontWeight: 800, color: "var(--muted, #94a3b8)", margin: 0, lineHeight: 1.6 }}>
        Billing is not live yet — joining is by tester code during the
        private beta.
      </p>
    );
  }
  return (
    <button type="button" className="btn btn-primary" onClick={checkout} disabled={busy}>
      Join — {MEMBERSHIP_PRICE_LABEL}
    </button>
  );
}
