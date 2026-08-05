// Owner-only tester-code panel. Same server-side gate as the owner hub —
// a logged-out visitor is sent to the owner login and returned here.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerAuthed } from "../session";
import TesterCodesPanel from "./TesterCodesPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tester Codes",
  robots: { index: false, follow: false, nocache: true },
};

export default async function TesterCodesPage() {
  if (!(await isOwnerAuthed())) redirect("/owner?to=/owner/tester-codes");
  return <TesterCodesPanel />;
}
