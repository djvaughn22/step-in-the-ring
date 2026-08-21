"use client";

// The door itself. Deliberately small and unalarming: this is a courtesy
// passcode for something that isn't finished, not a security checkpoint, and
// the copy should never make a visitor feel like they broke in.
//
// The passcode is typed here and POSTed. It is never stored in this browser,
// never put in the URL, and never compared on this side — the comparison and
// the session both live on the server. See app/preview/previewAuth.ts.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PreviewGate({
  title = "Preview access",
  what,
  returnTo,
}: {
  title?: string;
  /** What the visitor is about to open, in one sentence. */
  what?: string;
  /** Where to land after unlocking. Validated against the registry server-side. */
  returnTo?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !value.trim()) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: value, returnTo }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; returnTo?: string | null }
        | null;

      if (res.ok && data?.ok) {
        setValue("");
        router.replace(data.returnTo ?? returnTo ?? "/everything");
        router.refresh();
        return;
      }

      if (res.status === 429) {
        setError("Too many tries. Give it a few minutes.");
      } else if (res.status === 401) {
        setError("That code didn't work.");
      } else {
        setError("Previews aren't open right now.");
      }
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sheet-main">
      <form className="gate" onSubmit={submit}>
        <h1>{title}</h1>
        <p>{what ?? "This one isn't public yet."}</p>

        {error ? (
          <p className="gate-error" role="alert">
            {error}
          </p>
        ) : null}

        <label htmlFor="preview-passcode" className="sr-only">
          Passcode
        </label>
        <input
          id="preview-passcode"
          name="passcode"
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Passcode"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
          autoFocus
        />

        <button type="submit" className="btn btn-gold" disabled={busy || !value.trim()}>
          {busy ? "Opening…" : "Open preview"}
        </button>

        <p className="gate-note">Use the passcode you were given.</p>
      </form>
    </main>
  );
}
