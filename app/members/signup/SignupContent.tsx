"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { safeRedirectDestination } from "../../lib/safe-redirect";

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

/**
 * Private-beta join door.
 *
 * There is no approval queue during UAT: email + the shared tester password
 * admits immediately and signs the tester in, so this form deliberately has no
 * "confirm password" field and no password-strength rule. Those belong to
 * account creation, and this is not account creation — the shared password is
 * an admission credential checked by the server, and the server is the only
 * thing that knows it.
 */
export default function SignupContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeRedirectDestination(search.get("returnTo"), "/builds");

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/members/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, source: "signup-page" }),
      });
      const data = await res.json();

      if (res.ok) {
        // Already signed in — the session cookie came back on this response.
        router.replace(returnTo);
        return;
      }
      setError(data.error || "Could not sign you in. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="page" style={{ maxWidth: 500, margin: "0 auto", paddingTop: 60 }}>
        <section style={{ marginBottom: 40 }}>
          <h1 style={{ marginBottom: 8 }}>Join the test</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 0 }}>
            Step In The Ring is in private testing. Enter your email and the
            tester password you were given.
          </p>
        </section>

        <form className="card stack" onSubmit={handleJoin}>
          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
              required
              style={FIELD_STYLE}
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Tester password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="The password you were given"
              disabled={loading}
              required
              autoComplete="off"
              style={FIELD_STYLE}
            />
          </div>

          {error && <div style={{ color: "var(--error)", fontSize: 14 }}>{error}</div>}

          <button
            type="submit"
            className="btn btn-gold"
            disabled={loading || !email || !password}
          >
            {loading ? "Signing you in…" : "Start testing"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Been here before?{" "}
            <Link
              href="/members/login"
              style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 700 }}
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
