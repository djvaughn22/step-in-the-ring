// The front door for shared previews. Someone handed a code lands here,
// unlocks once, and can then open any page the registry marks `preview`
// without typing it again.
//
// If they're already unlocked, don't make them prove it twice: show what the
// code opens.

import type { Metadata } from "next";
import Link from "next/link";
import PreviewGate from "./PreviewGate";
import { isPreviewAuthorized } from "./previewAuth";
import { pagesWithAccess, EXTERNAL_PREVIEWS } from "../site/registry";
import { Sheet, Masthead, Band, Rows, Row } from "../site/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview access",
  description: "Open a shared preview with the code you were given.",
  robots: { index: false, follow: false },
};

export default async function PreviewPage() {
  const unlocked = await isPreviewAuthorized();

  if (!unlocked) {
    return (
      <PreviewGate
        title="Have a preview code?"
        what="Some things here are not finished enough to publish. If somebody gave you a code, this opens them."
        returnTo="/shop"
      />
    );
  }

  const pages = pagesWithAccess("preview");

  return (
    <Sheet wide>
      <Masthead
        kicker="Preview"
        title="You're in"
        lead="These are the unfinished pieces. Nothing here is final, and some of it will change or disappear."
      />

      <Band title="On this site">
        <Rows>
          {pages.map((p) => (
            <Row key={p.path} name={p.name} what={p.what} href={p.path} path={p.path} />
          ))}
        </Rows>
      </Band>

      {EXTERNAL_PREVIEWS.length > 0 ? (
        <Band
          title="Somewhere else"
          note="These live on another site and keep their own door, so they will ask for their own code."
        >
          <Rows>
            {EXTERNAL_PREVIEWS.map((p) => (
              <Row
                key={p.href}
                name={`${p.name} (example)`}
                what={`${p.what} ${p.why} Hosted on ${p.host}.`}
                href={p.href}
                external
              />
            ))}
          </Rows>
        </Band>
      ) : null}

      <section className="closing">
        <Link href="/everything" className="btn btn-ghost btn-big">
          See everything else
        </Link>
      </section>
    </Sheet>
  );
}
