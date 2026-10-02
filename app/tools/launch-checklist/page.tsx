import type { Metadata } from "next";
import Link from "next/link";
import ToolPage from "../ToolPage";
import ChecklistClient from "./ChecklistClient";

export const metadata: Metadata = {
  title: "Launch checklist",
  description:
    "The checks to run before you share a link: phone, links, privacy, a backup, and a way to reach you. Free, no account.",
};

export default function LaunchChecklistPage() {
  return (
    <ToolPage
      title="Launch checklist"
      lead="A few minutes of checking before you share a link saves a lot of fixing after. Tick each one off yourself. Nothing here scans your site."
      next={
        <p>
          Shared it? Bring the next idea to <Link href="/create">the idea box →</Link>
        </p>
      }
    >
      <ChecklistClient />
    </ToolPage>
  );
}
