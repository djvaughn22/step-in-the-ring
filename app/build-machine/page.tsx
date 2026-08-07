// Build Machine — free, no account needed. The physical entry point into
// the Open Mirror ecosystem: assess an old computer, prepare it safely,
// install the one supported Linux path, verify it, then open iDontCry and
// Step In The Ring. Not gated like /engines or the Five Hour Sprint tool —
// this is meant to reach someone before they've signed up for anything.

import type { Metadata } from "next";
import BuildMachineClient from "./BuildMachineClient";

export const metadata: Metadata = {
  title: "Build Machine",
  description:
    "Turn a computer you already have into a real local build environment. Assess it, prepare it safely, install the one supported Linux setup, verify it works, and open the ecosystem. Free during the open beta.",
};

export default function BuildMachinePage() {
  return <BuildMachineClient />;
}
