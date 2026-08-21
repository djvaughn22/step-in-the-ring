// EVERYTHING — the honest directory.
//
// The point of this page is that nothing here is hidden by accident. Every
// page of this site is listed, including the ones you can't open, with a plain
// label saying what kind of door is in front of it. Listing a door is not
// opening it: owner tools check the owner session on the server and are
// unaffected by anything on this page.
//
// It reads entirely from app/site/registry.ts. Do not hand-add a link here —
// add the row to the registry and it appears, and the route test keeps the
// registry honest against the filesystem.

import type { Metadata } from "next";
import Link from "next/link";
import {
  ECOSYSTEM,
  EXTERNAL_PREVIEWS,
  pagesInGroup,
  pagesWithAccess,
  type SitePage,
} from "../site/registry";
import { Sheet, PageHead, Section, DirectoryCard, DirectoryGrid } from "../site/ui";

export const metadata: Metadata = {
  title: "Everything",
  description:
    "Every page on Step In The Ring, every product built with it, and exactly what sits behind a door.",
};

function Pages({ pages }: { pages: SitePage[] }) {
  return (
    <DirectoryGrid>
      {pages.map((p) => (
        <DirectoryCard
          key={p.path}
          name={p.name}
          what={p.what}
          href={p.path}
          access={p.access}
        />
      ))}
    </DirectoryGrid>
  );
}

export default function EverythingPage() {
  const owner = pagesInGroup("owner");
  const preview = pagesWithAccess("preview");

  return (
    <Sheet wide>
      <PageHead
        kicker="Directory"
        title="Everything"
        lead="Every page on this site, every product that came out of it, and what's behind each door. Nothing is hidden on purpose."
      />

      <Section title="Start here">
        <Pages pages={pagesInGroup("start")} />
      </Section>

      <Section
        title="Your work"
        lead="The tools. Some need an account; the label says which."
      >
        <Pages pages={pagesInGroup("work")} />
      </Section>

      <Section title="What got made" lead="Finished things. They're live — open them.">
        <Pages pages={pagesInGroup("proof")} />
      </Section>

      <Section title="Reading">
        <Pages pages={pagesInGroup("learn")} />
      </Section>

      <Section title="Your account">
        <Pages pages={pagesInGroup("account")} />
      </Section>

      <Section
        title="Products"
        lead="Ten sites under one company. Each one is a real product with real people using it."
      >
        <DirectoryGrid>
          {ECOSYSTEM.map((p) => (
            <DirectoryCard
              key={p.name}
              emoji={p.emoji}
              name={p.name}
              what={p.what}
              note={p.real}
              href={p.liveUrl ?? "/explore"}
              external={Boolean(p.liveUrl)}
            />
          ))}
        </DirectoryGrid>
      </Section>

      <Section
        title="Code"
        lead="Every site above is built from its own repository. They're private for now — the products are the part meant to be public, and the repositories carry deployment settings that aren't."
      >
        <p className="dir-note" style={{ marginTop: 0 }}>
          If a repository opens up, it gets a link here rather than a mention.
        </p>
      </Section>

      {preview.length > 0 || EXTERNAL_PREVIEWS.length > 0 ? (
        <Section
          title="Shared previews"
          lead="Unfinished pieces the owner hands out one person at a time. A passcode opens them; it is not a login and it protects nothing private."
        >
          <DirectoryGrid>
            {preview.map((p) => (
              <DirectoryCard
                key={p.path}
                name={p.name}
                what={p.what}
                href={p.path}
                access="preview"
              />
            ))}
            {EXTERNAL_PREVIEWS.map((p) => (
              <DirectoryCard
                key={p.href}
                name={p.name}
                what={p.what}
                note={`${p.why} Hosted on ${p.host}, with its own passcode.`}
                href={p.href}
                access="preview"
                external
              />
            ))}
          </DirectoryGrid>
          <p className="dir-note">
            Got a passcode?{" "}
            <Link href="/preview" style={{ color: "var(--gold)", fontWeight: 800 }}>
              Enter it here
            </Link>
            .
          </p>
        </Section>
      ) : null}

      <Section
        title="Owner tools"
        lead="Listed so this page isn't lying by omission. These check the owner's own sign-in on the server — a preview passcode never reaches them."
      >
        <Pages pages={owner} />
      </Section>
    </Sheet>
  );
}
