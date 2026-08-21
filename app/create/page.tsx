// CREATE — the universal starting point.
//
// The home page asks the same question, but it also has to introduce the
// product to a stranger. This page does not: it is the workbench, so the
// question gets the whole screen and the person who does not know what to make
// gets a column of real starting points beside it.

import type { Metadata } from "next";
import RingApp from "./RingApp";

export const metadata: Metadata = {
  title: "Create",
  description:
    "Say what you want to make in your own words, or take one of the starting points. You leave with the smallest real version of it and the first move.",
};

export default function CreatePage() {
  return <RingApp mode="create" />;
}
