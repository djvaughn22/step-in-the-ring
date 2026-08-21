// ─────────────────────────────────────────────────────────────────────────────
// THE LIBRARY — work you saved and can use again.
//
// This page used to be the tool catalog, which is now what /engines is for.
// Two pages listing the same twelve engines is not a library, it is a
// duplicate, and it left the product with nowhere to answer the question
// "where is my stuff?".
//
// So the Library is now exactly that: what you saved, wherever it lives.
//   - engine projects on your account (server, only for a signed-in member)
//   - work saved in THIS BROWSER from before accounts existed (read-only)
//   - the starting points you can run again
//
// Builds are deliberately NOT listed here. A Build is a thing you are still
// making and it has its own page; the Library is the shelf you take things
// off, not the bench you work at.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { currentMember } from "../members/session";
import { getMemberStore, memberStoreConfigured } from "../members/store";
import { listOwnProjects } from "../members/projects";
import { BUILD_ENGINE_ID, capabilityById, displayName } from "../vnext/capabilities";
import LibraryClient, { type SavedItem } from "./LibraryClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Work you saved and can use again — engine projects on your account, anything kept in this browser, and the starting points you can run from.",
};

export default async function LibraryPage() {
  const storeConfigured = memberStoreConfigured();
  const member = storeConfigured ? await currentMember() : null;

  let saved: SavedItem[] = [];
  let listFailed = false;
  if (member) {
    try {
      const store = await getMemberStore();
      if (store) {
        const all = await listOwnProjects(store, member.user.id);
        saved = all
          // A Build is not a library item — it lives on /builds.
          .filter((p) => p.engineId !== BUILD_ENGINE_ID)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .map((p) => {
            const cap = capabilityById(p.engineId);
            return {
              id: p.id,
              title: p.title,
              madeWith: cap ? displayName(cap) : p.engineId,
              emoji: cap?.emoji ?? "📄",
              // Back to the engine that made it, which is the only place that
              // knows how to open the thing.
              href: cap ? `${cap.href}${cap.href.includes("?") ? "&" : "?"}p=${p.id}` : "/engines",
              updatedAt: p.updatedAt,
            };
          });
      }
    } catch {
      // A database hiccup must never be reported as "you have nothing saved".
      listFailed = true;
    }
  }

  return (
    <LibraryClient
      saved={saved}
      signedIn={Boolean(member)}
      storeConfigured={storeConfigured}
      listFailed={listFailed}
    />
  );
}
