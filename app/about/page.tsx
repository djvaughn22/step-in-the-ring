import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About StepInTheRing",
  description:
    "Say a rough idea however it comes out; get back a version-one plan and a ready-to-use builder prompt. Free, no account.",
};

export default function AboutPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 12px", color: "var(--ink, #e8edf5)" }}>
          About StepInTheRing<span style={{ color: "var(--gold)" }}>.com</span>
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--muted, #94a3b8)", margin: "0 0 28px" }}>
          StepInTheRing turns a rough idea into a real first build. Say it however it comes out —
          one box, at most one follow-up question — and get back a clear plan for version one.
        </p>

        <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px", color: "var(--ink, #e8edf5)" }}>What you can do here</h2>
        <ul style={{ fontSize: 15, lineHeight: 1.8, color: "var(--muted, #94a3b8)", margin: "0 0 28px", paddingLeft: 18 }}>
          <li>Shape an idea into a version-one plan and a ready-to-use builder prompt.</li>
          <li>
            Use the Engine Room&rsquo;s focused engines when you already know what kind of thing
            you&rsquo;re making — open to everyone right now.
          </li>
          <li>Follow the first-app coach in six short rounds if you&rsquo;ve never built before.</li>
          <li>See finished builds that started here.</li>
          <li>Download your brief and creation record, and bring them back later to continue.</li>
        </ul>

        <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px", color: "var(--ink, #e8edf5)" }}>Your work</h2>
        <p style={{ border: "1px solid var(--line, #26324c)", borderRadius: 14, padding: "14px 16px", fontSize: 15, lineHeight: 1.65, color: "var(--ink, #e8edf5)", margin: "0 0 28px" }}>
          Free, no account. What you type stays on this device unless you download it yourself.
        </p>

        <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--muted, #94a3b8)", margin: 0 }}>
          StepInTheRing is an{" "}
          <a href="https://openmirrorllc.com" style={{ color: "var(--gold)", textDecoration: "none" }}>
            Open Mirror LLC
          </a>{" "}
          project.
        </p>
      </div>
    </main>
  );
}
