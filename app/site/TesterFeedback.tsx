"use client";

// The tester's way back to the owner: one short note, no account. It sends
// the page path (never the query string, which can hold someone's idea), the
// note, and a reply email only if they choose to give one.

import { useEffect, useId, useRef, useState } from "react";

const KINDS = [
  { id: "bug", label: "Something broke" },
  { id: "confusing", label: "Confusing" },
  { id: "idea", label: "An idea" },
  { id: "loved", label: "Loved it" },
] as const;

type Kind = (typeof KINDS)[number]["id"];

export default function TesterFeedback({ open = false, title = "Tell us how it went" }: { open?: boolean; title?: string }) {
  const uid = useId();
  const [kind, setKind] = useState<Kind | "">("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [note, setNote] = useState("");
  const details = useRef<HTMLDetailsElement>(null);

  // Any "Give feedback" link on the site points at #tester-feedback; opening
  // the footer form in place keeps the tester on the page they mean.
  useEffect(() => {
    if (open) return;
    const reveal = () => {
      if (window.location.hash === "#tester-feedback" && details.current) {
        details.current.open = true;
        details.current.querySelector("summary")?.focus();
      }
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!kind) {
      setState("error");
      setNote("Pick what kind of note this is.");
      return;
    }
    setState("sending");
    setNote("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: kind,
          message,
          replyEmail: email,
          website,
          contextUrl: window.location.pathname,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (data.ok) {
        setState("sent");
        setMessage("");
        setEmail("");
        setKind("");
      } else {
        setState("error");
        setNote(data.error ?? "That didn't send. Email ask@openmirrorllc.com instead.");
      }
    } catch {
      setState("error");
      setNote("That didn't send. Email ask@openmirrorllc.com instead.");
    }
  }

  const form =
    state === "sent" ? (
      <div className="tfb-done" role="status">
        <strong>Thank you. A person reads every note.</strong>
        <button type="button" className="text-link tfb-again" onClick={() => setState("idle")}>
          Send another
        </button>
      </div>
    ) : (
      <form className="tfb-form" onSubmit={submit} noValidate>
        <fieldset className="tfb-kinds">
          <legend>What kind of note?</legend>
          {KINDS.map((k) => (
            <label key={k.id} className={kind === k.id ? "tfb-kind on" : "tfb-kind"}>
              <input type="radio" name={`${uid}-kind`} value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} />
              {k.label}
            </label>
          ))}
        </fieldset>
        <label className="tfb-label" htmlFor={`${uid}-msg`}>
          What happened?
        </label>
        <textarea
          id={`${uid}-msg`}
          className="tfb-input"
          rows={3}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What you tried, what you expected, what you got."
          required
        />
        <label className="tfb-label" htmlFor={`${uid}-email`}>
          Email <span className="tfb-opt">(only if you want a reply)</span>
        </label>
        <input
          id={`${uid}-email`}
          className="tfb-input"
          type="email"
          autoComplete="email"
          maxLength={200}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {/* Left empty by people; bots fill it in. */}
        <input
          className="tfb-hp"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <div className="tfb-go">
          <button className="btn btn-gold btn-small" type="submit" disabled={state === "sending" || !message.trim()}>
            {state === "sending" ? "Sending…" : "Send note"}
          </button>
          <span className="tfb-fine">No account needed. We keep the page you were on, never what you typed into the tools.</span>
        </div>
        <p className="tfb-err" role="alert">
          {state === "error" ? note : ""}
        </p>
      </form>
    );

  if (open) {
    return (
      <section className="tfb tfb-open" aria-labelledby={`${uid}-title`}>
        <h3 id={`${uid}-title`} className="tfb-title">
          {title}
        </h3>
        {form}
      </section>
    );
  }
  return (
    <details className="tfb" id="tester-feedback" ref={details}>
      <summary className="tfb-summary">{title}</summary>
      {form}
    </details>
  );
}
