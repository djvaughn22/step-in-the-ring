import type { Metadata } from "next";
import Link from "next/link";
import AboutDestinationCard from "../components/AboutDestinationCard";
import { BUILD_WITH_CARD } from "../lib/destinations";
import { Sheet, PageHead, Section } from "../site/ui";

export const metadata: Metadata = {
  title: "About StepInTheRing",
  description:
    "Say a rough idea however it comes out; get back a version-one plan and a ready-to-use builder prompt. Free, no account.",
};

export default function AboutPage() {
  return (
    <Sheet>
      <PageHead
        title={
          <>
            About StepInTheRing<span style={{ color: "var(--gold)" }}>.com</span>
          </>
        }
        lead="StepInTheRing turns a rough idea into a real first build. Say it however it comes out — one box, at most one follow-up question — and get back a clear plan for version one."
      />

      <Section title="What you can do here">
        <ul style={{ fontSize: 15, lineHeight: 1.8, color: "var(--muted)", margin: 0, paddingLeft: 18 }}>
          <li>Shape an idea into a version-one plan and a ready-to-use builder prompt.</li>
          <li>
            Use the Engine Room&rsquo;s focused engines when you already know what kind of thing
            you&rsquo;re making — open to everyone right now.
          </li>
          <li>Follow the first-app coach in six short rounds if you&rsquo;ve never built before.</li>
          <li>See finished builds that started here.</li>
          <li>Download your brief and creation record, and bring them back later to continue.</li>
        </ul>
      </Section>

      <Section title="Your work">
        <p style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", fontSize: 15, lineHeight: 1.65, color: "var(--text)", margin: 0 }}>
          Free, no account. What you type stays on this device unless you download it yourself.
        </p>
      </Section>

      {/* The consulting card — after the site's own story. */}
      <div style={{ marginTop: 46 }}>
        <AboutDestinationCard card={BUILD_WITH_CARD} />
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--muted)", margin: "28px 0 0" }}>
        StepInTheRing is an{" "}
        <a href="https://openmirrorllc.com" style={{ color: "var(--gold)", textDecoration: "none" }}>
          Open Mirror LLC
        </a>{" "}
        project.
      </p>

      {/* The footer's Contact and Disclaimer links land on these two
          sections (family standard, 2026-08-02). */}
      <Section title="Contact">
        <p id="contact" style={{ fontSize: 15, lineHeight: 1.65, color: "var(--muted)", margin: 0, scrollMarginTop: 96 }}>
          Have a question or an idea? Email{" "}
          <a
            href="mailto:ask@openmirrorllc.com?subject=Open%20Mirror%20Inquiry"
            style={{ color: "var(--gold)" }}
          >
            ask@openmirrorllc.com
          </a>
          .
        </p>
      </Section>

      <Section title="Disclaimer">
        <p id="disclaimer" style={{ fontSize: 15, lineHeight: 1.65, color: "var(--muted)", margin: 0, scrollMarginTop: 96 }}>
          Open Mirror LLC is independently owned and operated. Nothing
          published by Open Mirror LLC is sponsored by, affiliated with,
          endorsed by, or representative of the owner&rsquo;s full-time
          employer. Read the{" "}
          <a href="https://openmirrorllc.com/disclaimer" style={{ color: "var(--gold)" }}>
            full Open Mirror disclaimer
          </a>
          .
        </p>
      </Section>

      <p style={{ marginTop: 34 }}>
        <Link href="/everything" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none", fontSize: 13.5 }}>
          See everything else →
        </Link>
      </p>
    </Sheet>
  );
}
