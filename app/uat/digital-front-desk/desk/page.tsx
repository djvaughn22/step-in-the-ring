import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerAuthed } from "../../../owner/session";
import { DFD_OPEN_UAT_MODE } from "../lib/openMode";
import DeskClient from "./DeskClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Owner's Desk" };

export default async function DeskPage() {
  // TEMPORARY: DFD_OPEN_UAT_MODE short-circuits the owner check below —
  // see lib/openMode.ts. The check itself is untouched, so restoring the
  // gate is a one-line change there, not a rewrite of this page.
  if (!DFD_OPEN_UAT_MODE && !(await isOwnerAuthed())) redirect("/owner?to=/uat/digital-front-desk/desk");
  return <DeskClient />;
}
