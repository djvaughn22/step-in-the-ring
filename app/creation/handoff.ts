// The `cr` query parameter — iDontCry's versioned handoff into StepInTheRing.
//
// Mirrored by iDontCry's src/lib/ringHandoff.ts (the encoder). The two files
// share the payload shape by contract, not by import — these are separate
// repositories. If the shape changes, bump `v` and keep this decoder able to
// read every version ever emitted.
//
// The legacy `?idea=` parameter is still honoured by the planner. `cr` adds
// structure; it never replaces the plain-words path.

import { parseHandoffPayload, type HandoffPayloadV1 } from "./types";

export const HANDOFF_PARAM = "cr";

/** Max encoded size we accept — beyond this, senders fall back to a copyable pack. */
export const HANDOFF_MAX_ENCODED = 1800;

/** Read and validate a handoff from a query string. Malformed → null, quietly. */
export function readHandoffFromSearch(search: string): HandoffPayloadV1 | null {
  try {
    const raw = new URLSearchParams(search).get(HANDOFF_PARAM);
    if (!raw || raw.length > HANDOFF_MAX_ENCODED) return null;
    return parseHandoffPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Encode a payload for a URL. Returns null when it would not fit safely. */
export function encodeHandoff(p: HandoffPayloadV1): string | null {
  const parsed = parseHandoffPayload(p);
  if (!parsed) return null;
  const encoded = encodeURIComponent(JSON.stringify(parsed));
  return encoded.length <= HANDOFF_MAX_ENCODED ? encoded : null;
}

/* ── Engine intake prefill from a handoff ────────────────────────────────
   When a handoff lands directly in the Engine Room (?engine=X&cr=…), the
   payload becomes that engine's own intake answers — the creator never
   retypes what they already said. Keys match engines.ts intake keys. */

/** iDontCry Dream Shop product names → this Design Shop's intake options. */
const DREAM_SHOP_PRODUCT_TYPES: Record<string, string> = {
  Printable: "Printable / Digital",
  Sticker: "Sticker Sheet",
  Shirt: "T-Shirt / Apparel",
  Mug: "Mug / Drinkware",
  Card: "Card Deck",
  Journal: "Journal / Planner",
  "Digital Download": "Printable / Digital",
  Bundle: "Undecided / Mixed",
  "Surprise Me": "Undecided / Mixed",
};

export function handoffToIntake(
  engineId: string,
  p: Pick<HandoffPayloadV1, "idea" | "title" | "facts">,
): Record<string, string> {
  const f = p.facts ?? {};
  const base: Record<string, string> = {};
  if (p.title) base.name = p.title;

  switch (engineId) {
    case "design-shop":
      return {
        ...base,
        idea: p.idea,
        ...(f.audience ? { customer: f.audience } : {}),
        ...(f.productType ? { productType: DREAM_SHOP_PRODUCT_TYPES[f.productType] ?? f.productType } : {}),
        ...(f.spark ? { spark: f.spark } : {}),
        ...(f.vibe ? { theme: f.vibe } : {}),
      };
    case "idea":
      return { ...base, rough: p.idea, seed: p.idea, ...(f.audience ? { who: f.audience } : {}) };
    case "build":
      return { ...base, purpose: p.idea, ...(f.audience ? { who: f.audience } : {}) };
    case "sell":
      return { ...base, product: p.idea, ...(f.audience ? { customer: f.audience } : {}) };
    default:
      return { ...base, rough: p.idea, idea: p.idea };
  }
}

/** A full creation record becomes the target engine's intake the same way. */
export function recordToIntake(
  engineId: string,
  r: { originalIdea: string; originalTitle?: string; facts: Record<string, string>; answers: Record<string, string> },
): Record<string, string> {
  const fromRecord = handoffToIntake(engineId, {
    idea: r.originalIdea,
    title: r.originalTitle,
    facts: { ...r.facts, ...(r.answers.audience ? { audience: r.answers.audience } : {}) },
  });
  return fromRecord;
}
