// ─────────────────────────────────────────────────────────────────────────────
// EVERYTHING — the map of Step In The Ring.
//
// Note what this page is NOT. It used to open with ten Open Mirror websites
// and then list them a second time as repositories, which made the directory
// of a product read like the directory of a company. Step In The Ring is one
// product; this page is the whole of it, in the same eight sections the menu
// and the homepage use, in the same order. Other Open Mirror products appear
// once, at the bottom, as evidence — and the company's own directory is a
// link, not a section.
//
// Nothing here is hidden by accident. Every page of this site is listed,
// including the ones you can't open, with a plain label saying what kind of
// door is in front of it. Listing a door is not opening it: owner tools check
// the owner session on the server and are unaffected by anything on this page.
//
// It reads entirely from app/site/registry.ts. Never hand-add a link here.
// Add the row to the registry and it appears, and the route test keeps the
// registry honest against the filesystem.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import Link from "next/link";
import {
  ECOSYSTEM,
  EXTERNAL_PREVIEWS,
  pagesInGroup,
  type SitePage,
} from "../site/registry";
import { Sheet, Masthead, Band, Jump, Rows, Row, Tiles, Tile } from "../site/ui";
import { isPreviewAuthorized } from "../preview/previewAuth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Everything",
  description:
    "Every page in Step In The Ring, what each one is for, and exactly what sits behind a door.",
};

function PageRows({ pages }: { pages: SitePage[] }) {
  return (
    <Rows>
      {pages.map((p) => (
        <Row
          key={p.path}
          name={p.name}
          what={p.what}
          href={p.path}
          access={p.access}
          path={p.path}
        />
      ))}
    </Rows>
  );
}

export default async function EverythingPage() {
  const featured = ECOSYSTEM.filter((p) => p.featured && p.liveUrl);
  const unlocked = await isPreviewAuthorized();

  return (
    <Sheet wide>
      <Masthead
        kicker="The directory"
        title="Everything in Step In The Ring"
        lead="Every page, what it is for, and what kind of door is in front of it. If it exists here, it is on this page."
      >
        <Jump
          items={[
            { label: "Create", href: "#create" },
            { label: "Engines", href: "#engines" },
            { label: "Builds", href: "#builds" },
            { label: "Library", href: "#library" },
            { label: "Learn", href: "#learn" },
            { label: "Proof", href: "#proof" },
            { label: "Previews", href: "#previews" },
            { label: "Account", href: "#account" },
            { label: "Owner", href: "#owner" },
          ]}
        />
      </Masthead>

      <Band
        id="create"
        title="Create"
        note="Where you say what you want to make. Both of these are the same flow."
      >
        <PageRows pages={pagesInGroup("create")} />
      </Band>

      <Band
        id="engines"
        title="Engines"
        note="Focused tools that make one part of something. Open to anyone — no account to look, and none to use one."
      >
        <PageRows pages={pagesInGroup("engines")} />
      </Band>

      <Band id="builds" title="Builds" note="The things you're actually making.">
        <PageRows pages={pagesInGroup("builds")} />
      </Band>

      <Band id="library" title="Library" note="Work you saved and can use again.">
        <PageRows pages={pagesInGroup("library")} />
      </Band>

      <Band id="learn" title="Learn" note="What this is and how the loop works.">
        <PageRows pages={pagesInGroup("learn")} />
      </Band>

      <Band id="proof" title="Proof" note="Finished things. They are live, so open them.">
        <PageRows pages={pagesInGroup("proof")} />
      </Band>

      <Band
        id="previews"
        title="Protected preview"
        note="The one thing on this site behind a shared code. Everything else here is open."
      >
        <Rows>
          {EXTERNAL_PREVIEWS.map((p) =>
            unlocked ? (
              <Row
                key={p.href}
                name={`${p.name} (example)`}
                what={`${p.what} ${p.why} Hosted on ${p.host}, with its own passcode.`}
                href={p.href}
                access="preview"
                external
              />
            ) : (
              <Row
                key={p.href}
                name={`${p.name} (example)`}
                what={`${p.what} Enter the access code to open it.`}
                href="/preview"
                access="preview"
              />
            ),
          )}
        </Rows>
        {!unlocked && (
          <p style={{ marginTop: 20, fontSize: 14 }}>
            Have a code? <Link href="/preview" className="more">Enter it here</Link>.
          </p>
        )}
      </Band>

      <Band id="account" title="Your account">
        <PageRows pages={pagesInGroup("account")} />
      </Band>

      <Band
        id="owner"
        title="Owner tools"
        note="Listed so this page is not lying by leaving them out. Each one checks the owner's own sign-in on the server. A preview passcode never reaches them."
      >
        <PageRows pages={pagesInGroup("owner")} />
      </Band>

      <Band
        id="made"
        title="Made this way"
        note="Products that came out of this loop, as evidence that it finishes things. They are separate products with their own homes."
      >
        <Tiles>
          {featured.map((p) => (
            <Tile key={p.name} p={p} />
          ))}
        </Tiles>
        <p style={{ marginTop: 20, fontSize: 14 }}>
          More of them on <Link href="/explore" className="more">Explore</Link>, and the
          whole company&apos;s work at{" "}
          <a
            className="more"
            href="https://openmirrorllc.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Mirror
          </a>
          .
        </p>
      </Band>
    </Sheet>
  );
}
