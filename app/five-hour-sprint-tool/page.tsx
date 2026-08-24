// The Five Hour Sprint Tool — open to anyone, no account. It is a real
// Step In The Ring tool, not membership value; see app/membership/page.tsx
// for what membership actually is now (optional cross-device account sync).

import type { Metadata } from "next";
import FiveHourSprintClient from "./FiveHourSprintClient";

export const metadata: Metadata = {
  title: "Five Hour Sprint Tool",
  description: "Plan, track, and report on a focused five-hour AI build.",
  robots: { index: false, follow: false, nocache: true },
};

export default function FiveHourSprintToolPage() {
  return <FiveHourSprintClient />;
}
