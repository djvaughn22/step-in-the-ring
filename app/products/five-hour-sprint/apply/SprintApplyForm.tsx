"use client";

// The Sprint application form — POSTs to /api/sprint/apply. No account, no
// payment: this records a lead the owner reviews by hand. Marketing consent
// is a separate checkbox, always unchecked to start — never bundled into
// submitting the application itself.

import { FormEvent, useState } from "react";

const FIELD_STYLE = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--surface)",
  color: "var(--text)",
  fontFamily: "inherit",
  fontSize: 15,
};

const TEXTAREA_STYLE = { ...FIELD_STYLE, minHeight: 90, resize: "vertical" as const };

type Timing = "asap" | "this-month" | "exploring";
type TeamSize = "individual" | "team";

export default function SprintApplyForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatToFinish, setWhatToFinish] = useState("");
  const [successLooksLike, setSuccessLooksLike] = useState("");
  const [timing, setTiming] = useState<Timing>("this-month");
  const [teamSize, setTeamSize] = useState<TeamSize>("individual");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/sprint/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          whatToFinish,
          successLooksLike,
          timing,
          teamSize,
          marketingConsent,
        }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && data?.ok) {
        setDone(true);
      } else {
        setError(data?.error ?? "Could not send that. Try again.");
      }
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card card-gold" role="status">
        <h3 style={{ margin: "0 0 8px" }}>Application sent</h3>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
          The owner reads every one of these. Expect a reply by email to set
          up the intake conversation.
        </p>
      </div>
    );
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <div>
        <label htmlFor="sprint-name" className="field-label">Name</label>
        <input
          id="sprint-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          disabled={busy}
          required
          style={FIELD_STYLE}
        />
      </div>

      <div>
        <label htmlFor="sprint-email" className="field-label">Email</label>
        <input
          id="sprint-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={busy}
          required
          style={FIELD_STYLE}
        />
      </div>

      <div>
        <label htmlFor="sprint-finish" className="field-label">What needs to be finished</label>
        <textarea
          id="sprint-finish"
          value={whatToFinish}
          onChange={(e) => setWhatToFinish(e.target.value)}
          placeholder="Describe the one deliverable, as clearly as you can."
          disabled={busy}
          required
          style={TEXTAREA_STYLE}
        />
      </div>

      <div>
        <label htmlFor="sprint-success" className="field-label">What success looks like</label>
        <textarea
          id="sprint-success"
          value={successLooksLike}
          onChange={(e) => setSuccessLooksLike(e.target.value)}
          placeholder="How you'll know it's done and working."
          disabled={busy}
          required
          style={TEXTAREA_STYLE}
        />
      </div>

      <div>
        <label htmlFor="sprint-timing" className="field-label">When you want this to happen</label>
        <select
          id="sprint-timing"
          value={timing}
          onChange={(e) => setTiming(e.target.value as Timing)}
          disabled={busy}
          style={FIELD_STYLE}
        >
          <option value="asap">As soon as possible</option>
          <option value="this-month">Sometime this month</option>
          <option value="exploring">Just exploring for now</option>
        </select>
      </div>

      <div>
        <label htmlFor="sprint-team" className="field-label">Individual or team</label>
        <select
          id="sprint-team"
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value as TeamSize)}
          disabled={busy}
          style={FIELD_STYLE}
        >
          <option value="individual">Just me</option>
          <option value="team">A team</option>
        </select>
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--muted)" }}>
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
          disabled={busy}
          style={{ marginTop: 3 }}
        />
        It&apos;s fine to email me other Step In The Ring updates. (Optional — applying works either way.)
      </label>

      {error && (
        <p role="alert" style={{ color: "var(--error, #fca5a5)", fontSize: 14, margin: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-gold"
        disabled={busy || !name.trim() || !email.trim() || !whatToFinish.trim() || !successLooksLike.trim()}
      >
        {busy ? "Sending…" : "Send application"}
      </button>
    </form>
  );
}
