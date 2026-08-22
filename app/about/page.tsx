import type { Metadata } from "next";
import Link from "next/link";
import AboutDestinationCard from "../components/AboutDestinationCard";
import { BUILD_WITH_CARD } from "../lib/destinations";
import { Sheet, PageHead, Section } from "../site/ui";

export const metadata: Metadata = {
  title: "About StepInTheRing",
  description:
    "Say a rough idea however it comes out; get back a version-one plan and a ready-to-use builder prompt. Start without an account.",
};

export default function AboutPage() {
  return (
    <Sheet>
      <PageHead
        kicker="About"
        title={
          <>
            Step In The Ring<span style={{ color: "var(--gold)" }}>.com</span>
          </>
        }
        lead="A place to take something you want to make and turn it into something real. Say it however it comes out, answer at most one question, and leave with a plan for version one."
      />

      <Section title="What you can do here">
        <ul style={{ fontSize: 15, lineHeight: 1.8, color: "var(--muted)", margin: 0, paddingLeft: 18 }}>
          <li>Say what you want to make and get back a plan for version one and a ready-to-use builder prompt.</li>
          <li>Open a focused engine when you already know what kind of thing you&rsquo;re making.</li>
          <li>Keep what you&rsquo;re making as a Build, and come back to it any time.</li>
          <li>Save what an engine makes for you in your Library, and use it again.</li>
          <li>Follow the first-build coach in six short rounds if you&rsquo;ve never built before.</li>
          <li>See finished things that started here.</li>
        </ul>
      </Section>

      <Section title="Your work">
        <p style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", fontSize: 15, lineHeight: 1.65, color: "var(--text)", margin: 0 }}>
          Saying an idea and reading the plan back needs no account, and stays
          on this device unless you download it. Opening an Engine or saving
          a Build needs a sign-in, so your work can follow you to another
          device — free during the open beta.
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
