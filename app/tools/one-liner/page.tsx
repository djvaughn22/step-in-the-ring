import type { Metadata } from "next";
import Link from "next/link";
import ToolPage from "../ToolPage";
import ExplainerClient from "./ExplainerClient";

export const metadata: Metadata = {
  title: "One-line explainer",
  description:
    "Turn what you made into a page title, a one-line description, and a message to send with the link, in your own words. Free, no account.",
};

export default function OneLinerPage() {
  return (
    <ToolPage
      title="One-line explainer"
      lead="If you can't say what it is in one line, people won't open the link. Answer four short questions and get the words they see first."
      next={
        <p>
          Words ready? <Link href="/tools/launch-checklist">Run the launch checklist →</Link>
        </p>
      }
    >
      <ExplainerClient />
    </ToolPage>
  );
}
