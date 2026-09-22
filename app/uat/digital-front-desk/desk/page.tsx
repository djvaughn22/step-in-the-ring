import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerAuthed } from "../../../owner/session";
import DeskClient from "./DeskClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Owner's Desk" };

export default async function DeskPage() {
  if (!(await isOwnerAuthed())) redirect("/owner?to=/uat/digital-front-desk/desk");
  return <DeskClient />;
}
