"use client";

// The make-with-AI front door moved from "/" to /make on 2026-11-11. Links
// from other sites (iDontCry's Dream Lab, saved-work links) still arrive at
// "/?idea=…" or "/?open=…". The head script already moved those words out of
// the address bar into this tab's session; this sends the visitor on to /make,
// where RingApp reads them, without ever putting them back in a URL.

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasArrival } from "../site/arrival";

export default function ArrivalForward() {
  const router = useRouter();
  useEffect(() => {
    if (hasArrival()) router.replace("/make");
  }, [router]);
  return null;
}
