// Owner-only feedback triage. Same server-side gate as the owner hub — a
// logged-out visitor is sent to the owner login and returned here.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerAuthed } from "../session";
import FeedbackPanel from "./FeedbackPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tester Feedback",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OwnerFeedbackPage() {
  if (!(await isOwnerAuthed())) redirect("/owner?to=/owner/feedback");
  return <FeedbackPanel />;
}
