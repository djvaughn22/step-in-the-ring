"use client";

// The project request form. Posts JSON to /api/inquiry; the thank-you shows
// ONLY after the server says the request was saved. method="post" keeps the
// words out of the address bar even if the script never loads (a GET would
// put them in the URL, which analytics reads).
//
// A link like /request#business preselects that service. The hash is read
// once on mount and never carries anything a person typed.

import { useEffect, useId, useRef, useState } from "react";
import { BUDGETS, PROJECT_TYPES, SERVICE_CHOICES, TIMELINES } from "../services/offers";

type Fields = Partial<Record<string, string>>;

export default function RequestForm() {
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const openedAt = useRef<number>(0);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const serviceRef = useRef<HTMLSelectElement>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Fields>({});

  useEffect(() => {
    openedAt.current = Date.now();
    const fromHash = window.location.hash.replace(/^#/, "");
    if (serviceRef.current && SERVICE_CHOICES.some((s) => s.id === fromHash)) serviceRef.current.value = fromHash;
  }, []);

  useEffect(() => {
    if (state === "sent") doneRef.current?.focus();
  }, [state]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState("sending");
    setError("");
    setFields({});
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, elapsedMs: Date.now() - openedAt.current }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Fields };
      if (res.ok && json.ok) {
        setState("sent");
        return;
      }
      setFields(json.fields ?? {});
      setError(json.error || "That didn't send. Email ask@openmirrorllc.com instead.");
      setState("idle");
      // Move focus to the first field that needs a look, or the message.
      requestAnimationFrame(() => {
        const first = json.fields && Object.keys(json.fields)[0];
        const el = first ? formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`) : null;
        (el ?? errorRef.current)?.focus();
      });
    } catch {
      setError("That didn't send. Check your connection, or email ask@openmirrorllc.com.");
      setState("idle");
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  if (state === "sent") {
    return (
      <div className="rq-done" role="status" tabIndex={-1} ref={doneRef}>
        <h2>Thanks. We have your request.</h2>
        <p>
          We read every request ourselves and reply by email, usually within two business days.
          Nothing is booked and nothing is charged until you approve a written quote.
        </p>
        <p className="rq-fine">If you don&apos;t hear back, check your spam folder or write to ask@openmirrorllc.com.</p>
      </div>
    );
  }

  const err = (k: string) =>
    fields[k] ? (
      <span className="rq-err" id={id(`${k}-err`)}>
        {fields[k]}
      </span>
    ) : null;
  const aria = (k: string, hint?: boolean) => ({
    "aria-invalid": fields[k] ? true : undefined,
    "aria-describedby": [fields[k] ? id(`${k}-err`) : "", hint ? id(`${k}-hint`) : ""].filter(Boolean).join(" ") || undefined,
  });

  return (
    <form className="rq-form" method="post" action="/api/inquiry" onSubmit={submit} noValidate ref={formRef}>
      <div className="rq-two">
        <div className="rq-field">
          <label htmlFor={id("name")}>Your name</label>
          <input id={id("name")} name="name" autoComplete="name" required maxLength={120} {...aria("name")} />
          {err("name")}
        </div>
        <div className="rq-field">
          <label htmlFor={id("email")}>Email</label>
          <input id={id("email")} name="email" type="email" autoComplete="email" required maxLength={254} {...aria("email")} />
          {err("email")}
        </div>
      </div>
      <div className="rq-two">
        <div className="rq-field">
          <label htmlFor={id("organization")}>
            Business or organization <span className="rq-opt">(optional)</span>
          </label>
          <input id={id("organization")} name="organization" autoComplete="organization" maxLength={160} {...aria("organization")} />
          {err("organization")}
        </div>
        <div className="rq-field">
          <label htmlFor={id("siteUrl")}>
            Website you have now <span className="rq-opt">(optional)</span>
          </label>
          <input id={id("siteUrl")} name="siteUrl" inputMode="url" autoComplete="url" placeholder="example.com" maxLength={300} {...aria("siteUrl")} />
          {err("siteUrl")}
        </div>
      </div>
      <div className="rq-two">
        <div className="rq-field">
          <label htmlFor={id("projectType")}>What kind of project?</label>
          <select id={id("projectType")} name="projectType" required defaultValue="" {...aria("projectType")}>
            <option value="" disabled>Choose one</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          {err("projectType")}
        </div>
        <div className="rq-field">
          <label htmlFor={id("service")}>Which service?</label>
          <select id={id("service")} name="service" required defaultValue="" ref={serviceRef} {...aria("service")}>
            <option value="" disabled>Choose one</option>
            {SERVICE_CHOICES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          {err("service")}
        </div>
      </div>
      <div className="rq-field">
        <label htmlFor={id("description")}>Tell us about it</label>
        <p className="rq-hint" id={id("description-hint")}>What it&apos;s for, who will use it, and anything you already have. A few sentences is plenty.</p>
        <textarea id={id("description")} name="description" required minLength={20} maxLength={4000} rows={6} {...aria("description", true)} />
        {err("description")}
      </div>
      <div className="rq-two">
        <div className="rq-field">
          <label htmlFor={id("timeline")}>When would you like it?</label>
          <select id={id("timeline")} name="timeline" required defaultValue="" {...aria("timeline")}>
            <option value="" disabled>Choose one</option>
            {TIMELINES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          {err("timeline")}
        </div>
        <div className="rq-field">
          <label htmlFor={id("budget")}>
            Budget <span className="rq-opt">(optional)</span>
          </label>
          <select id={id("budget")} name="budget" defaultValue="" {...aria("budget")}>
            {BUDGETS.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
          {err("budget")}
        </div>
      </div>
      {/* For bots only. People never see or reach it. */}
      <div className="rq-hp" aria-hidden="true">
        <label htmlFor={id("nickname")}>Leave this empty</label>
        <input id={id("nickname")} name="nickname" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="rq-go">
        <button className="btn btn-gold" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send request"}
        </button>
        <p className="rq-fine">
          This is a request, not an order. We reply by email, and nothing is charged here. We use
          your details only to answer you.
        </p>
      </div>
      {error ? (
        <p className="rq-error" role="alert" tabIndex={-1} ref={errorRef}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
