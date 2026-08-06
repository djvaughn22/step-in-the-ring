// The Five Hour Sprint Tool is a paid member feature — the authorization
// check runs HERE, on the server, before any tool UI is rendered. A visitor
// without live membership is sent to the membership page and returns to this
// exact URL once they join. Same gate shape as /engines.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FiveHourSprintClient from "./FiveHourSprintClient";
import { currentMember } from "../members/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Five Hour Sprint Tool",
  description: "Plan, track, and report on a focused five-hour AI build.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function FiveHourSprintToolPage() {
  const member = await currentMember();
  if (member?.access.memberAccess) {
    return <FiveHourSprintClient />;
  }
  redirect("/membership?from=five-hour-sprint-tool");
}
