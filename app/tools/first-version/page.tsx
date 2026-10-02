import type { Metadata } from "next";
import Link from "next/link";
import ToolPage from "../ToolPage";
import CutterClient from "./CutterClient";

export const metadata: Metadata = {
  title: "First version cutter",
  description:
    "List everything your idea could do, sort it into now, later and not doing, and leave with a first version small enough to finish. Free, no account.",
};

export default function FirstVersionPage() {
  return (
    <ToolPage
      title="First version cutter"
      lead="Ideas get stuck when version one tries to be everything. List it all, sort it, and keep only what the first version can't live without."
      next={
        <p>
          Got your first version? <Link href="/tools/try-it">Put it in front of one real person →</Link>
        </p>
      }
    >
      <CutterClient />
    </ToolPage>
  );
}
