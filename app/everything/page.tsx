// EVERYTHING — the map of the whole world.
//
// Nothing here is hidden by accident. Every page of this site is listed,
// including the ones you can't open, with a plain label saying what kind of
// door is in front of it. Listing a door is not opening it: owner tools check
// the owner session on the server and are unaffected by anything on this page.
//
// It reads entirely from app/site/registry.ts. Never hand-add a link here.
// Add the row to the registry and it appears, and the route test keeps the
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
import { Sheet, Masthead, Band, Jump, Rows, Row, Tiles, Tile, accentVars } from "../site/ui";

export const metadata: Metadata = {
  title: "Everything",
  description:
    "Every page on Step In The Ring, every product built with it, every repository behind it, and exactly what sits behind a door.",
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

export default function EverythingPage() {
  const preview = pagesWithAccess("preview");

  return (
    <Sheet wide>
      <Masthead
        kicker="The directory"
        title="Everything"
        lead="Every product, every page, every repository, and what kind of door is in front of each one. If it exists, it is on this page."
      >
        <Jump
          items={[
            { label: "Products", href: "#products" },
            { label: "Make", href: "#make" },
            { label: "Proof", href: "#proof" },
            { label: "Reading", href: "#reading" },
            { label: "Account", href: "#account" },
            { label: "Previews", href: "#previews" },
            { label: "Code", href: "#code" },
            { label: "Owner", href: "#owner" },
          ]}
        />
      </Masthead>

      <Band
        id="products"
        title="Products"
        note="Ten sites under one company. Every one is live and open to anyone."
      >
        <Tiles>
          {ECOSYSTEM.map((p) => (
            <Tile key={p.name} p={p} />
          ))}
        </Tiles>
      </Band>

      <Band id="make" title="Make something" note="The tools. The label says which need an account.">
        <PageRows pages={[...pagesInGroup("start"), ...pagesInGroup("work")]} />
      </Band>

      <Band id="proof" title="What got made" note="Finished things. They are live, so open them.">
        <PageRows pages={pagesInGroup("proof")} />
      </Band>

      <Band id="reading" title="Reading">
        <PageRows pages={pagesInGroup("learn")} />
      </Band>

      <Band id="account" title="Your account">
        <PageRows pages={pagesInGroup("account")} />
      </Band>

      <Band
        id="previews"
        title="Shared previews"
        note="Unfinished pieces handed out one person at a time. A passcode opens them. It is not a login and it protects nothing private."
      >
        <Rows>
          {preview.map((p) => (
            <Row
              key={p.path}
              name={p.name}
              what={p.what}
              href={p.path}
              access="preview"
              path={p.path}
            />
          ))}
          {EXTERNAL_PREVIEWS.map((p) => (
            <Row
              key={p.href}
              name={`${p.name} (example)`}
              what={`${p.what} ${p.why} Hosted on ${p.host}, with its own passcode.`}
              href={p.href}
              access="preview"
              external
            />
          ))}
        </Rows>
        <p style={{ marginTop: 20, fontSize: 14 }}>
          Got a code?{" "}
          <Link href="/preview" style={{ color: "var(--gold)", fontWeight: 800 }}>
            Put it in here
          </Link>
          .
        </p>
      </Band>

      <Band
        id="code"
        title="The code"
        note="Every product above is built from its own repository. Private for now: the products are the part meant to be public, and the repositories carry deployment settings that are not."
      >
        <div>
          {ECOSYSTEM.map((p) => (
            <div className="repo" key={p.name} style={accentVars(p.accent)}>
              <span className="repo-mark" aria-hidden="true">
                {p.emoji}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="repo-name">{p.name}</div>
                <p className="repo-what">{p.what}</p>
              </div>
              <div className="repo-side">
                <span className="repo-tag">
                  {p.repoPublic ? "Public repo" : "Private repo"}
                </span>
                {p.repoUrl ? (
                  <a
                    className="repo-open"
                    href={p.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Code
                  </a>
                ) : null}
                {p.liveUrl ? (
                  <a
                    className="repo-open"
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Band>

      <Band
        id="owner"
        title="Owner tools"
        note="Listed so this page is not lying by leaving them out. Each one checks the owner's own sign-in on the server. A preview passcode never reaches them."
      >
        <PageRows pages={pagesInGroup("owner")} />
      </Band>
    </Sheet>
  );
}
