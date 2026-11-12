"use client";

// One quiet line for someone who already has a draft in this browser.

import Link from "next/link";
import { useEffect, useState } from "react";
import { DRAFT_KEY, parseDraft } from "./draft";

export default function ContinueDraft() {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    try {
      const d = parseDraft(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "null"));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read this browser's storage once, after mount
      if (d) setName(d.details.name.trim() || "your business");
    } catch {
      /* nothing saved, or storage is blocked */
    }
  }, []);
  if (!name) return null;
  return (
    <p className="xc-continue">
      You have a draft for <strong>{name}</strong> in this browser.{" "}
      <Link className="text-link" href="/start/edit">Keep working on it&nbsp;→</Link>
    </p>
  );
}
