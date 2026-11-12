import type { Metadata } from "next";
import RingApp from "../create/RingApp";
import { MAKE_ONE_LINE } from "../site/brand";

// The make-with-AI front door. Until 2026-11-11 this was the home page; it
// moved here, whole, when the website starter became the first step. The
// workbench itself still lives at /create.
export const metadata: Metadata = {
  title: "Make it with AI",
  description: MAKE_ONE_LINE,
};

export default function MakePage() {
  return <RingApp mode="home" />;
}
