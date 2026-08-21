// The front door for shared previews. Someone handed a passcode can land here
// directly, unlock once, and then open any page the registry marks `preview`
// without typing it again.
//
// If they're already unlocked, don't make them prove it twice — show what the
// passcode opens.

import type { Metadata } from "next";
import Link from "next/link";
import PreviewGate from "./PreviewGate";
import { isPreviewAuthorized } from "./previewAuth";
import { pagesWithAccess, EXTERNAL_PREVIEWS } from "../site/registry";
import { Sheet, PageHead, Section, DirectoryCard, DirectoryGrid } from "../site/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview access",
  description: "Open a shared preview with the passcode you were given.",
  robots: { index: false, follow: false },
};

export default async function PreviewPage() {
  const unlocked = await isPreviewAuthorized();

  if (!unlocked) {
    return (
      <PreviewGate
        what="Some things here aren't finished enough to publish. If someone gave you a passcode, this opens them."
        returnTo="/shop"
      />
    );
  }

  const pages = pagesWithAccess("preview");

  return (
    <Sheet>
      <PageHead
        kicker="Preview"
        title="You're in"
        lead="These are the unfinished pieces. Look around — nothing here is final."
      />

      <Section title="On this site">
        <DirectoryGrid>
          {pages.map((p) => (
            <DirectoryCard key={p.path} name={p.name} what={p.what} href={p.path} />
          ))}
        </DirectoryGrid>
      </Section>

      {EXTERNAL_PREVIEWS.length > 0 ? (
        <Section
          title="Somewhere else"
          lead="These live on another site and keep their own door, so they'll ask for their own passcode."
        >
          <DirectoryGrid>
            {EXTERNAL_PREVIEWS.map((p) => (
              <DirectoryCard
                key={p.href}
                name={p.name}
                what={p.what}
                note={`${p.why} Hosted on ${p.host}.`}
                href={p.href}
                external
              />
            ))}
          </DirectoryGrid>
        </Section>
      ) : null}

      <Section title="Back">
        <p className="sec-lead" style={{ marginBottom: 0 }}>
          <Link href="/everything" style={{ color: "var(--gold)", fontWeight: 800 }}>
            See everything else →
          </Link>
        </p>
      </Section>
    </Sheet>
  );
}
