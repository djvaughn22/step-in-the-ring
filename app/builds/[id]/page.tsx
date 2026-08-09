// One Build: Bring it → Shape it → Build it → Live → Grow.
//
// The whole page answers one question first — what is happening right now, and
// what is the next real move. Everything else (what it is, what has helped,
// what came out, what happened) sits under that.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentMember } from "../../members/session";
import { getMemberStore, memberStoreConfigured } from "../../members/store";
import { readProject } from "../../members/projects";
import { BUILD_ENGINE_ID } from "../../vnext/capabilities";
import { parseBuild } from "../../vnext/build";
import BuildDetail from "./BuildDetail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your build",
  robots: { index: false, follow: false, nocache: true },
};

export default async function BuildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!memberStoreConfigured()) redirect("/builds");
  const member = await currentMember();
  if (!member) redirect(`/members/login?returnTo=${encodeURIComponent(`/builds/${id}`)}`);

  const store = await getMemberStore();
  if (!store) redirect("/builds");

  const found = await readProject(store, member.user.id, id);
  // A build that isn't yours is a 404, same rule as every other project read.
  if (!found.ok || found.value.engineId !== BUILD_ENGINE_ID) notFound();

  const build = parseBuild(found.value.content);
  if (!build) notFound();

  return (
    <BuildDetail
      build={{ ...build, id, title: found.value.title, updatedAt: found.value.updatedAt }}
      canEdit={member.access.memberAccess}
    />
  );
}
