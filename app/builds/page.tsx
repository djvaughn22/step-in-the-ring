// YOUR BUILDS — the authenticated centre of gravity in vNext.
//
// A Build is what you're making. This page lists the ones on your account
// (server-persistent, through the existing member project store) and, for
// anyone who was here before vNext, points at the work already sitting in
// their browser. It is deliberately NOT a dashboard: no charts, no metrics,
// no engine grid — just what you're making and the next real move.
//
// Signed out is a first-class state on purpose. Somebody who used Step In The
// Ring before accounts existed still has work in this browser, and they must
// be able to find it without signing in to anything.

import type { Metadata } from "next";
import { currentMember } from "../members/session";
import { getMemberStore, memberStoreConfigured } from "../members/store";
import { listOwnProjects } from "../members/projects";
import { BUILD_ENGINE_ID } from "../vnext/capabilities";
import { buildsFromProjects, type BuildRecordV1 } from "../vnext/build";
import BuildsClient from "./BuildsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your builds",
  description: "What you're making, and the next real move on each one.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function BuildsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // An idea handed over from the landing page arrives as ?intent=.
  const handed = (await searchParams).intent;
  const initialIntent = (typeof handed === "string" ? handed : "").slice(0, 2000);

  const storeConfigured = memberStoreConfigured();
  const member = storeConfigured ? await currentMember() : null;

  let builds: BuildRecordV1[] = [];
  if (member) {
    const store = await getMemberStore();
    if (store) {
      builds = buildsFromProjects(await listOwnProjects(store, member.user.id), BUILD_ENGINE_ID);
    }
  }

  return (
    <BuildsClient
      builds={builds}
      signedIn={Boolean(member)}
      canSave={Boolean(member?.access.memberAccess)}
      storeConfigured={storeConfigured}
      email={member?.user.email ?? null}
      initialIntent={initialIntent}
    />
  );
}
