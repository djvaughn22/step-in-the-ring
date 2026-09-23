import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerAuthed } from "../../../owner/session";
import { DFD_OPEN_UAT_MODE } from "../lib/openMode";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin Controls" };

export default async function AdminPage() {
  // TEMPORARY: see lib/openMode.ts — the owner check below is untouched,
  // only short-circuited while DFD_OPEN_UAT_MODE is true.
  if (!DFD_OPEN_UAT_MODE && !(await isOwnerAuthed())) redirect("/owner?to=/uat/digital-front-desk/admin");
  return <AdminClient />;
}
