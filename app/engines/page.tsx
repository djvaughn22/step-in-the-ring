import type { Metadata } from "next";
import AccessGate from "./AccessGate";
import EngineSystem from "./EngineSystem";

export const metadata: Metadata = {
  title: "Engine Room — Step In The Ring",
  description:
    "Start creating in 1, 2, 3. Choose what to make, get the free tools, and finish a real first project.",
  robots: { index: false, follow: false },
};

export default function EnginesPage() {
  return (
    <AccessGate>
      <EngineSystem />
    </AccessGate>
  );
}
