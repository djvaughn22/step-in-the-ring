import type { Metadata } from "next";
import Link from "next/link";
import ToolPage from "../ToolPage";
import TryItClient from "./TryItClient";

export const metadata: Metadata = {
  title: "Try-it script",
  description:
    "A short script for putting what you made in front of one real person, and a place to write down what happened. Free, no account.",
};

export default function TryItPage() {
  return (
    <ToolPage
      title="Try-it script"
      lead="Watching one real person use what you made teaches more than another week of guessing. Get a short script to read from, then write down what happened."
      next={
        <p>
          Made your change and ready to share it? <Link href="/tools/launch-checklist">Run the launch checklist →</Link>
        </p>
      }
    >
      <TryItClient />
    </ToolPage>
  );
}
