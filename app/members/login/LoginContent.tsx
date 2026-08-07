"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Stage = "login" | "pending-approval" | "error";

export default function LoginContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>("login");
  const returnTo = search.get("returnTo") || "/engines";

  useEffect(() => {
    const maybeToken = search.get("token");
    if (maybeToken) {
      // Token already set in cookie by the API, redirect to intended destination
      router.replace(returnTo);
    }
  }, [router, returnTo, search]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // The API sets the session cookie, redirect to intended destination
        router.replace(returnTo);
      } else if (res.status === 403) {
        // Valid credentials but not approved
        setStage("pending-approval");
        setEmail(data.email || email);
      } else {
        // Bad credentials or other error
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "pending-approval") {
    return (
      <main>
        <div className="page" style={{ maxWidth: 500, margin: "0 auto", paddingTop: 60 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <h1 style={{ marginBottom: 12 }}>Pending Approval</h1>
            <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.6, marginBottom: 20 }}>
              Your account <b>{email}</b> has been created. Access is pending approval from the owner.
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
              You'll be able to sign in once your account is approved. Check back soon.
            </p>
            <div className="actions">
              <button className="btn btn-gold" onClick={() => setStage("login")}>
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="page" style={{ maxWidth: 500, margin: "0 auto", paddingTop: 60 }}>
        <section style={{ marginBottom: 40 }}>
          <h1 style={{ marginBottom: 8 }}>Sign in to Step In The Ring</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 0 }}>
            Email and password.
          </p>
        </section>

        <form className="card stack" onSubmit={handleLogin}>
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
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: 15,
              }}
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: 15,
              }}
            />
          </div>

          {error && <div style={{ color: "var(--error)", fontSize: 14 }}>{error}</div>}

          <button type="submit" className="btn btn-gold" disabled={loading || !email || !password}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            No account yet?{" "}
            <Link href="/members/signup" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 700 }}>
              Sign up →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
