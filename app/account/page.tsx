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
    <main>
      <div className="page" style={{ maxWidth: 760 }}>
        <header className="mast">
          <span className="kicker">Your account</span>
          <h1 className="mast-title" style={{ fontSize: "clamp(26px, 3.6vw, 40px)", wordBreak: "break-word" }}>
            {member.user.email}
          </h1>
          <hr className="rule mast-rule" />
        </header>
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
