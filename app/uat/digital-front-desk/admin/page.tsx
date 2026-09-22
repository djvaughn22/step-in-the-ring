import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerAuthed } from "../../../owner/session";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin Controls" };

export default async function AdminPage() {
  if (!(await isOwnerAuthed())) redirect("/owner?to=/uat/digital-front-desk/admin");
  return <AdminClient />;
}
