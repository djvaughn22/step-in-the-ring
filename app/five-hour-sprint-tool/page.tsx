// The Five Hour Sprint planner — a free tool, open to anyone, no account.
// Listed on /tools. Work saves to this browser only.

import type { Metadata } from "next";
import FiveHourSprintClient from "./FiveHourSprintClient";

export const metadata: Metadata = {
  title: "Five Hour Sprint planner",
  description: "Plan, track, and report on one focused five-hour build session. Free, no account, saves to this browser.",
};

export default function FiveHourSprintToolPage() {
  return <FiveHourSprintClient />;
}
