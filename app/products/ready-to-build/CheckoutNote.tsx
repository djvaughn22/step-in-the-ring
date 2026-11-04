"use client";

// After Stripe sends a visitor back without a purchase (or checkout couldn't
// start), say what happened. Read from the URL in the browser so the product
// page itself stays static.

import { useEffect, useState } from "react";
import { KIT_CONTACT_EMAIL } from "../../kit/kit";

const NOTES: Record<string, string> = {
  canceled: "Checkout was canceled. Nothing was charged.",
  unavailable: `Checkout couldn't start just now. Nothing was charged. Try again in a few minutes, or email ${KIT_CONTACT_EMAIL}.`,
  busy: "That was a lot of tries at once. Wait a few minutes, then try again.",
  closed: "The kit isn't on sale right now. Nothing was charged.",
};

export default function CheckoutNote() {
  const [note, setNote] = useState("");
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("checkout") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the URL once after hydration
    setNote(NOTES[key] ?? "");
  }, []);
  if (!note) return null;
  return <p role="status" style={{ margin: 0, color: "var(--text)", fontWeight: 650 }}>{note}</p>;
}
