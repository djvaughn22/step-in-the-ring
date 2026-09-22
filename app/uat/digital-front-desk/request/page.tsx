// Customer intake — PUBLIC. A Digital Front Desk that required a customer
// to sign in before submitting a request would defeat its own purpose, so
// this page (and the API route it posts to) checks only the feature flag,
// never the owner session. See lib/apiGate.ts's dfdFlagGate() and
// docs/DIGITAL_FRONT_DESK_UAT.md's access-model table.

import type { Metadata } from "next";
import RequestClient from "./RequestClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Customer Intake" };

export default function RequestPage() {
  return <RequestClient />;
}
