import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerAuthed } from "../../../owner/session";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Onboarding Preview" };

export default async function OnboardingPage() {
  if (!(await isOwnerAuthed())) redirect("/owner?to=/uat/digital-front-desk/onboarding");
  return <OnboardingClient />;
}
