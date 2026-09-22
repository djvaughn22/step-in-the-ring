"use client";

// Onboarding preview — shows what it would feel like for a new business to
// configure their own front desk. This is explicitly a PREVIEW: submitting
// records a lead (the same "apply, owner reviews by hand" shape as
// app/members/sprintApplication.ts) and does NOT create a real account,
// business config, or team. No full onboarding flow exists yet.

import { useState } from "react";
import { card, inputBase, label as labelStyle, btnPrimary } from "../lib/ui";
import type { OnboardingApplication, OnboardingPlan } from "../lib/types";

const PLANS: { value: OnboardingPlan; name: string; what: string }[] = [
  { value: "starter", name: "Starter Pilot", what: "One person, one inbox — proving the workflow before anything bigger." },
  { value: "working", name: "Working Business", what: "A small team, multiple assignees, and a real pipeline to run day to day." },
  { value: "pro", name: "Operations Pro", what: "Multiple locations or crews, with escalation routing." },
];

export default function OnboardingClient() {
  const [plan, setPlan] = useState<OnboardingPlan | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<OnboardingApplication | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      const res = await fetch("/api/uat/digital-front-desk/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, businessName, email }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrors(data.errors ?? ["Something went wrong."]);
        return;
      }
      setSubmitted(data.application);
    } catch {
      setErrors(["Couldn't reach the server. Try again."]);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 18px 72px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 8px" }}>Preview application saved</h1>
        <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 20px" }}>
          This records a lead the owner reviews by hand — it does not create an account or a live business
          configuration. A full onboarding flow (business setup, team, custom questions) isn&rsquo;t built yet.
        </p>
        <div style={{ ...card, textAlign: "left" }}>
          <Row label="Plan" value={PLANS.find((p) => p.value === submitted.plan)?.name ?? submitted.plan} />
          <Row label="Business" value={submitted.businessName} />
          <Row label="Email" value={submitted.email} last />
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "32px 18px 72px" }}>
      <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
        Preview only
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 8px" }}>Set up your front desk</h1>
      <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 24px" }}>
        A taste of what configuring a real business would feel like. Choose a plan and leave your details — the
        owner follows up by hand. Nothing here provisions a real account yet.
      </p>

      {errors.length > 0 && (
        <div style={{ ...card, borderColor: "#EB5757", marginBottom: 18 }} role="alert">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--muted)" }}>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={labelStyle}>Plan</legend>
          <div style={{ display: "grid", gap: 8 }}>
            {PLANS.map((p) => (
              <label
                key={p.value}
                style={{ ...card, padding: "10px 12px", display: "flex", gap: 10, cursor: "pointer", borderColor: plan === p.value ? "var(--gold)" : "var(--line)" }}
              >
                <input type="radio" name="plan" checked={plan === p.value} onChange={() => setPlan(p.value)} style={{ marginTop: 3 }} required />
                <span>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 800 }}>{p.name}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>{p.what}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label style={{ display: "block" }}>
          <span style={labelStyle}>Business name</span>
          <input style={inputBase} value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
        </label>

        <label style={{ display: "block" }}>
          <span style={labelStyle}>Email</span>
          <input type="email" style={inputBase} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.7 : 1 }}>
          {busy ? "Saving…" : "Save preview application"}
        </button>
      </form>
    </main>
  );
}

function Row({ label: text, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 12 }}>
      <p style={{ fontSize: 11, fontWeight: 900, color: "var(--muted)", textTransform: "uppercase", margin: "0 0 3px" }}>{text}</p>
      <p style={{ fontSize: 13.5, margin: 0 }}>{value}</p>
    </div>
  );
}
