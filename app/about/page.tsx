import type { Metadata } from "next";
import Link from "next/link";
import { Sheet, PageHead, Section } from "../site/ui";
import { BRAND_ONE_LINE, BRAND_OWNERSHIP, WHY_THE_NAME } from "../site/brand";
import { INDEPENDENCE_NOTICE } from "../services/offers";

export const metadata: Metadata = {
  title: "About StepInTheRing",
  description:
    "A website starter for small service businesses: start from an example, make it yours, download the files. Optional help publishing, from Open Mirror LLC.",
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
        lead={`${BRAND_ONE_LINE} ${BRAND_OWNERSHIP}`}
      />

      <Section title="Ways to use it">
        <ul style={{ fontSize: 15, lineHeight: 1.8, color: "var(--muted)", margin: 0, paddingLeft: 18 }}>
          <li><strong style={{ color: "var(--text)" }}>The website starter.</strong> <Link href="/start">Choose an example</Link> for your kind of business, change the words, colors, fonts, photos and sections, and download the files. No account.</li>
          <li><strong style={{ color: "var(--text)" }}>Help from us, if you want it.</strong> Publishing help, finishing your draft, or a site built for you, with a written quote first. <Link href="/services">See services</Link> or <Link href="/request">request a project</Link>.</li>
          <li><strong style={{ color: "var(--text)" }}>Make other things with AI.</strong> <Link href="/make">The workspace</Link>, tools and engines on this site, with no account and no coding.</li>
        </ul>
      </Section>

      <Section title="Who builds it">
        <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--muted)", margin: 0 }}>
          Step In The Ring is run by Open Mirror LLC, a small independent company. Every project
          is planned, checked and tested by a person before anything goes live. You can see{" "}
          <Link href="/builds">sites we&rsquo;ve built and run ourselves</Link>.
        </p>
      </Section>

      <Section title="What you can do here">
        <ul style={{ fontSize: 15, lineHeight: 1.8, color: "var(--muted)", margin: 0, paddingLeft: 18 }}>
          <li>Start a website for your business from one of 22 examples, preview it on a phone and a computer, and download the files.</li>
          <li>Say what you want to make and get a first message to give an AI, then the next message each time you want something changed.</li>
          <li>Bring something that isn&rsquo;t a thing to make: a bill you don&rsquo;t understand, a decision, a question.</li>
          <li>Open a guided engine when you already know what kind of thing you&rsquo;re making.</li>
          <li>Come back to everything you started in Your work, kept in this browser.</li>
          <li>Follow six short steps to put your first website or app online.</li>
          <li>See finished things that started here, and <Link href="/whats-built">what works today versus what is still being built</Link>.</li>
        </ul>
      </Section>

      <Section title="How AI fits in">
        <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--muted)", margin: 0 }}>
          This site doesn&rsquo;t run an AI. It writes the messages, and you paste them into the AI
          app you choose. ChatGPT, Claude, Copilot and Gemini are separate services with their own
          accounts and rules, and none of them is connected with this site. Kids should do this with
          a parent or another adult they trust.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--muted)", margin: "12px 0 0" }}>
          {WHY_THE_NAME}
        </p>
      </Section>

      <Section title="Your work">
        <p style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", fontSize: 15, lineHeight: 1.65, color: "var(--text)", margin: 0 }}>
          Nothing here needs an account, and there is no sign-up. What you type
          stays on this device unless you download it or paste it into an AI app
          yourself, and you&apos;ll find it under <Link href="/library">Your work</Link>.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--muted)", margin: "12px 0 0" }}>
          While it&apos;s in testing, we count visits and which pages and tools
          get used, so we know what&apos;s worth building next. We never count
          what you type. If your browser asks not to be tracked, we count
          nothing. The site also uses Google Analytics for page visits.
        </p>
      </Section>

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

      {/* The full disclaimer lives here, once. The site footer carries a
          one-line note that links to it (owner, 2026-11-10). */}
      <Section title="Disclaimer">
        <div id="disclaimer" style={{ display: "grid", gap: 12, fontSize: 15, lineHeight: 1.65, color: "var(--muted)", scrollMarginTop: 96 }}>
          <p style={{ margin: 0 }}>{INDEPENDENCE_NOTICE}</p>
          <p style={{ margin: 0 }}>
            Open Mirror LLC and its projects are not affiliated with, sponsored by, or endorsed by the
            owner&rsquo;s current or former employers or their affiliates.
          </p>
          <p style={{ margin: 0 }}>
            Plans, messages, and next steps here are suggestions, and what an AI app gives you back can
            be wrong. You decide what to make, and you&rsquo;re responsible for checking it before you
            rely on it or share it.
          </p>
          <p style={{ margin: 0 }}>
            Read the{" "}
            <a href="https://openmirrorllc.com/disclaimer" style={{ color: "var(--gold)" }}>
              full Open Mirror disclaimer
            </a>
            .
          </p>
        </div>
      </Section>

      <p style={{ marginTop: 34 }}>
        <Link href="/everything" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none", fontSize: 13.5 }}>
          See everything else →
        </Link>
      </p>
    </Sheet>
  );
}
