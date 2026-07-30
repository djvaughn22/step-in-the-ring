// Project OS — owner-only since the shared owner gate landed.
// The authorization check runs HERE, on the server, before the workspace UI
// is rendered. Logged-out visitors go to the Owner Entrance and return here.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProjectsWorkspace from "./ProjectsWorkspace";
import { isOwnerAuthed } from "../owner/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every project in one place: what it is, what version one includes, what's proven, what's assumed, and the one next action.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ProjectsPage() {
  if (!(await isOwnerAuthed())) redirect(`/owner?to=${encodeURIComponent("/projects")}`);
  return <ProjectsWorkspace />;
}
