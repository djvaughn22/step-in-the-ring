// THE LIBRARY — everything Step In The Ring can already do, in one honest list.
//
// vNext moved the engines out of primary navigation. It did not retire a
// single one. This page is where they live now: a directory, one level down
// from the question, with the same activation labels the Engine Room uses.
// Every route listed here worked before vNext and still works.

import type { Metadata } from "next";
import LibraryClient from "./LibraryClient";
import { allCapabilities } from "../vnext/capabilities";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Every tool in Step In The Ring with an honest label on it, plus anything you saved here before. Nothing was thrown away.",
};

export default function LibraryPage() {
  return <LibraryClient capabilities={allCapabilities()} />;
}
