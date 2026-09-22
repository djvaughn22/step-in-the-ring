"use client";

// Customer intake form + confirmation. Public — no sign-in, here or in the
// API route it posts to (see docs/DIGITAL_FRONT_DESK_UAT.md's access-model
// table). The submit goes to a real API route and lands in a real
// server-side store — this is not a mockup that goes nowhere. It just isn't
// durable storage yet; see the confirmation page's own note on that.

import RingMark from "../../../site/RingMark";
import styles from "../front-desk.module.css";
import { useState } from "react";
import Link from "next/link";
import { DEMO_BUSINESS } from "../lib/business";
import { card, inputBase, label as labelStyle, btnPrimary } from "../lib/ui";
import type { ContactMethod, CustomerRequest, UrgencyLevel } from "../lib/types";

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; hint: string }[] = [
  { value: "routine", label: "Routine", hint: "No rush — whenever it fits the schedule." },
  { value: "soon", label: "Soon", hint: "Within the next several days." },
  { value: "urgent", label: "Urgent", hint: "Needs attention today or tomorrow." },
  { value: "safety_concern", label: "Safety concern", hint: "Something unsafe right now." },
];

const CONTACT_OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

interface FormState {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceArea: string;
  serviceId: string;
  description: string;
  urgency: UrgencyLevel;
  preferredContact: ContactMethod;
  consentToUpdates: boolean;
}

const EMPTY: FormState = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  serviceArea: "",
  serviceId: "",
  description: "",
  urgency: "routine",
  preferredContact: "email",
  consentToUpdates: false,
};

export default function RequestClient() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<CustomerRequest | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      const res = await fetch("/api/uat/digital-front-desk/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrors(data.errors ?? ["Something went wrong. Please try again."]);
        return;
      }
      setSubmitted(data.request);
    } catch {
      setErrors(["Couldn't reach the server. Check your connection and try again."]);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) return <Confirmation request={submitted} />;

  return (
    <main className={styles.intake}>
      <Link className={styles.back} href="/uat/digital-front-desk">← Digital Front Desk</Link>
      <div className={styles.intakeLayout}>
      <div className={styles.intakeHeading}>
        <p className={styles.eyebrow}>Customer intake</p>
        <h1>What can we help with?</h1>
        <p>A few details will help the team understand your request. You’ll get a reference number when you submit.</p>
        <p className={styles.note}>Product test · No service is booked or messages sent. Please use sample contact details.</p>
      </div>
      <div>
      {errors.length > 0 && (
        <div style={{ ...card, borderColor: "#EB5757", marginBottom: 18 }} role="alert">
          <p style={{ fontSize: 13, fontWeight: 900, color: "#EB5757", margin: "0 0 6px" }}>Please fix the following:</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <fieldset className={styles.formSection}><legend>Your details</legend>
        <Field label="Your name">
          <input autoComplete="name" style={inputBase} value={form.customerName} onChange={(e) => set("customerName", e.target.value)} required />
        </Field>

        <Field label="Email">
          <input type="email" autoComplete="email" style={inputBase} value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} required />
        </Field>

        <Field label="Phone">
          <input type="tel" autoComplete="tel" style={inputBase} value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} required />
        </Field>

        </fieldset>
        <fieldset className={styles.formSection}><legend>The request</legend>
        <div className={styles.fieldPair}>
        <Field label="Service area">
          <select aria-label="Service area" style={inputBase} value={form.serviceArea} onChange={(e) => set("serviceArea", e.target.value)} required>
            <option value="" disabled>Choose an area</option>
            {DEMO_BUSINESS.serviceAreas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </Field>

        <Field label="Service">
          <select aria-label="Service" style={inputBase} value={form.serviceId} onChange={(e) => set("serviceId", e.target.value)} required>
            <option value="" disabled>Choose a service</option>
            {DEMO_BUSINESS.services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>

        </div>
        <Field label="Describe what you need">
          <textarea
            style={{ ...inputBase, minHeight: 100, resize: "vertical" }}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
          />
        </Field>

        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={labelStyle}>How urgent is this?</legend>
          <div className={styles.urgency}>
            {URGENCY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  ...card,
                  padding: "10px 12px",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  cursor: "pointer",
                  borderColor: form.urgency === opt.value ? "var(--accent)" : "var(--line)",
                }}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={opt.value}
                  checked={form.urgency === opt.value}
                  onChange={() => set("urgency", opt.value)}
                  style={{ marginTop: 3 }}
                />
                <span>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 800 }}>{opt.label}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        </fieldset>
        <fieldset className={styles.formSection}><legend>How to reach you</legend>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={labelStyle}>Preferred contact method</legend>
          <div style={{ display: "flex", gap: 10 }}>
            {CONTACT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  ...card,
                  padding: "9px 16px",
                  cursor: "pointer",
                  borderColor: form.preferredContact === opt.value ? "var(--accent)" : "var(--line)",
                  fontSize: 13.5,
                  fontWeight: 800,
                }}
              >
                <input
                  type="radio"
                  name="preferredContact"
                  value={opt.value}
                  checked={form.preferredContact === opt.value}
                  onChange={() => set("preferredContact", opt.value)}
                  style={{ marginRight: 8 }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
          <input
            type="checkbox"
            checked={form.consentToUpdates}
            onChange={(e) => set("consentToUpdates", e.target.checked)}
            style={{ marginTop: 3 }}
            required
          />
          <span>
            I agree to be contacted about this request using the method above. No messages are sent during this test.
          </span>
        </label>

        </fieldset>
        <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.7 : 1 }}>
          {busy ? "Submitting…" : "Submit request"}
        </button>
      </form>
      </div></div>
    </main>
  );
}

function Field({ label: text, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{text}</span>
      {children}
    </label>
  );
}

function Confirmation({ request }: { request: CustomerRequest }) {
  const service = DEMO_BUSINESS.services.find((s) => s.id === request.serviceId)?.name ?? request.serviceId;
  return (
    <main className={styles.confirmation}>
      <RingMark />
      <h1>Request received.</h1>
      <p>Thanks, {request.customerName}. Your request is ready for the team to review. Keep your reference number below.</p>
      <div style={{ ...card, marginBottom: 24, textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 900, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
          Confirmation number
        </p>
        <p style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace", color: "var(--accent)", margin: 0 }}>
          {request.confirmationNumber}
        </p>
      </div>

      <div style={{ ...card, textAlign: "left", marginBottom: 24 }}>
        <Row label="Name" value={request.customerName} />
        <Row label="Service" value={service} />
        <Row label="Area" value={request.serviceArea} />
        <Row label="Urgency" value={request.urgency.replace("_", " ")} />
        <Row label="Description" value={request.description} last />
      </div>

      <div style={{ ...card, textAlign: "left", marginBottom: 24 }}>
        <p style={{ fontSize: 13.5, fontWeight: 900, margin: "0 0 10px" }}>What happens next</p>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>The team reviews the details and decides the next step. Your preferred contact method is {request.preferredContact}.</p>
      </div>

      <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 20px" }}>
        Product test: this request is temporary. No service is booked and no messages are sent.
      </p>

      <Link href="/uat/digital-front-desk" style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>
        Back to Digital Front Desk →
      </Link>
    </main>
  );
}

function Row({ label: text, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 12 }}>
      <p style={{ fontSize: 11, fontWeight: 900, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 3px" }}>
        {text}
      </p>
      <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}
