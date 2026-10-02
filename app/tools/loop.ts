// Which free tool helps with which round of the loop. One list, used by the
// homepage rounds and the /how page, so both point at the same real pages.
// Index = round number - 1 (bring/say, shape, build/make, try, finish/again).
export const LOOP_TOOLS: { href: string; label: string }[] = [
  { href: "/create", label: "Open the idea box" },
  { href: "/tools/first-version", label: "First version cutter" },
  { href: "/five-hour-sprint-tool", label: "Plan a five-hour session" },
  { href: "/tools/try-it", label: "Try-it script" },
  { href: "/tools/launch-checklist", label: "Launch checklist" },
];
