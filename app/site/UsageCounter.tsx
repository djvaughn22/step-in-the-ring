"use client";

// Counts page views of public pages, once per page per tab, plus one
// "daily visitor" and (for a browser that has been here before) one
// "returning visitor" per day. The day flags stay in this browser; only the
// counts leave it. See app/lib/usage.ts.

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { countUsage, pageSlug } from "../lib/usage";

const FIRST_SEEN = "sitr-usage-first-day";
const LAST_COUNTED = "sitr-usage-last-day";

function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
}

export default function UsageCounter() {
  const pathname = usePathname();
  useEffect(() => {
    const slug = pageSlug(pathname ?? "/");
    if (!slug) return;
    try {
      const day = today();
      if (localStorage.getItem(LAST_COUNTED) !== day) {
        localStorage.setItem(LAST_COUNTED, day);
        countUsage("daily-visitor");
        const first = localStorage.getItem(FIRST_SEEN);
        if (!first) localStorage.setItem(FIRST_SEEN, day);
        else if (first < day) countUsage("returning-visitor");
      }
      const seenKey = `sitr-usage-seen:${slug}`;
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, "1");
    } catch {
      // storage blocked: still count the view, just without de-duplication
    }
    countUsage("page-view", slug);
  }, [pathname]);
  return null;
}
