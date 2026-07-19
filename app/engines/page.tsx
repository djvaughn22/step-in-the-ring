import type { Metadata } from "next";
import EngineSystem from "./EngineSystem";

// The access gate is OFF for now — the Engine Room is open to everyone.
// To bring it back, wrap EngineSystem in <AccessGate> again:
//
//   import AccessGate from "./AccessGate";
//   <AccessGate><EngineSystem /></AccessGate>
//
// AccessGate.tsx and access.ts stay in the repo, tested and ready. Codes
// already on visitors' devices keep working the day it returns.

export const metadata: Metadata = {
  title: "Engine Room",
  description:
    "Start creating in 1, 2, 3. Choose what to make, get the free tools, and finish a real first project.",
  robots: { index: false, follow: false },
};

export default function EnginesPage() {
  return <EngineSystem />;
}
