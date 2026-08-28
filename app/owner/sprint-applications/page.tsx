// Owner-only Sprint application triage. Same server-side gate as the owner
// hub — a logged-out visitor is sent to the owner login and returned here.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerAuthed } from "../session";
import SprintApplicationsPanel from "./SprintApplicationsPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sprint Applications",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OwnerSprintApplicationsPage() {
  if (!(await isOwnerAuthed())) redirect("/owner?to=/owner/sprint-applications");
  return <SprintApplicationsPanel />;
}
