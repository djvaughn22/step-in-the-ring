import ExampleFinder, { type CardData } from "./ExampleFinder";
import { EXAMPLE_GROUPS, EXAMPLES } from "./examples";
import { miniData } from "./MiniSite";

// The examples as cards, in plain groups, with a finder on top. Used by
// /start (pick one to begin) and /examples (look around first). Same cards,
// different main link. Only what a card shows travels to the browser, not
// each example's full wording.

export default function ExampleCards({ main }: { main: "start" | "view" }) {
  const cards: CardData[] = EXAMPLES.map((ex) => ({
    slug: ex.slug,
    name: ex.name,
    group: ex.group,
    blurb: ex.blurb,
    keywords: ex.keywords,
    mini: miniData(ex),
  }));
  return <ExampleFinder cards={cards} groups={[...EXAMPLE_GROUPS]} main={main} />;
}
