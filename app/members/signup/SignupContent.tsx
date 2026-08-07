"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Stage = "form" | "success" | "error";

export default function SignupContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [createdEmail, setCreatedEmail] = useState("");
  const returnTo = search.get("returnTo") || "/members/login";

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/members/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setCreatedEmail(email);
        setStage("success");
        // Auto-redirect to login in 4 seconds, or let them click
        setTimeout(() => {
          router.replace("/members/login");
        }, 4000);
      } else {
        setError(data.error || "Signup failed. Please try again.");
        setStage("error");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setStage("error");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "success") {
    return (
      <main>
        <div className="page" style={{ maxWidth: 500, margin: "0 auto", paddingTop: 60 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
            <h1 style={{ marginBottom: 12 }}>Account created</h1>
            <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.6, marginBottom: 20 }}>
              Welcome, <b>{createdEmail}</b>.
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
              Your account has been created and is pending owner approval. You'll receive access once it's approved.
            </p>
            <div className="actions">
              <button
                className="btn btn-gold"
                onClick={() => {
                  router.replace("/members/login");
                }}
              >
                Sign in
              </button>
            </div>
            <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 16 }}>
              Redirecting automatically in a moment…
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="page" style={{ maxWidth: 500, margin: "0 auto", paddingTop: 60 }}>
        <section style={{ marginBottom: 40 }}>
          <h1 style={{ marginBottom: 8 }}>Create your account</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 0 }}>
            Step In The Ring. Email and password.
          </p>
        </section>

        <form className="card stack" onSubmit={handleSignup}>
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
              placeholder="At least 10 characters"
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
            <label htmlFor="confirmPassword" className="field-label">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

          <button type="submit" className="btn btn-gold" disabled={loading || !email || !password || !confirmPassword}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Already have an account?{" "}
            <Link href="/members/login" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 700 }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
