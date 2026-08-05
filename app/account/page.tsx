// Member account page — profile, membership status, billing portal, and the
// account-linked project list. Everything personal renders behind the
// server-checked session; logged-out visitors are pointed at /membership.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentMember } from "../members/session";
import { memberStoreConfigured } from "../members/store";
import { readStripeConfig, stripeConfigured } from "../members/stripeCore";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AccountPage() {
  if (!memberStoreConfigured()) redirect("/membership");
  const member = await currentMember();
  if (!member) redirect("/membership");

  return (
    <main style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" }}>
        <span className="kicker">Your account</span>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: "6px 0 16px", color: "var(--ink, #e8edf5)" }}>
          {member.user.email}
        </h1>
        <AccountClient
          membershipStatus={member.access.status}
          memberAccess={member.access.memberAccess}
          activeUntil={member.access.activeUntil}
          billingLive={stripeConfigured(readStripeConfig())}
        />
      </div>
    </main>
  );
}
