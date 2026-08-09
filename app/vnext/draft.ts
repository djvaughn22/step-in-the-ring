// ─────────────────────────────────────────────────────────────────────────────
// THE DRAFT — an idea in flight, before it is a Build.
//
// Somebody stepped in, saw what they were making, and pressed "Keep this
// build". They may not have an account yet. Between that tap and a saved Build
// there is a sign-in round trip, and they must not be made to retype a word.
//
// This is the SMALLEST mechanism that survives that trip: sessionStorage, this
// tab, this visit. Deliberately not localStorage — an idea left in flight
// should not still be sitting in the browser next week pretending to be saved.
//
// The one law here is honesty about what this is:
//
//   A DRAFT IS NOT SAVED WORK.
//
// It is browser state. It does not survive the tab closing, it is not on the
// account, it is not on another device, and no surface may ever describe it as
// though it were. Durable persistence means a Build row on the server, and
// nothing else.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = "sitr-vnext-draft";

/** Same bound the Build API enforces — a draft can never exceed what saves. */
const MAX_INTENT = 2000;
const MAX_ANSWERS = 8;
const MAX_ANSWER = 600;

export interface CreationDraft {
  /** Their own words. Never rewritten. */
  intent: string;
  /** Answers to the one-question loop, keyed by question key. */
  answers: Record<string, string>;
  savedAt: string;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Private modes and locked-down browsers throw on access, not on use.
    return null;
  }
}

function cleanAnswers(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_ANSWERS) break;
    if (typeof v !== "string") continue;
    const clean = v.trim().slice(0, MAX_ANSWER);
    // An empty answer is a real answer — it means "decide for me" — so it is
    // kept, and only the key has to be sane.
    if (k && k.length <= 40) out[k] = clean;
  }
  return out;
}

/** Put an idea in flight. Returns false when the browser won't hold it. */
export function saveDraft(intent: string, answers: Record<string, string> = {}): boolean {
  const s = storage();
  const clean = intent.replace(/\s+/g, " ").trim().slice(0, MAX_INTENT);
  if (!s || !clean) return false;
  try {
    const draft: CreationDraft = {
      intent: clean,
      answers: cleanAnswers(answers),
      savedAt: new Date().toISOString(),
    };
    s.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/** Read an idea back. Never throws, and never returns a half-read draft. */
export function loadDraft(): CreationDraft | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    const intent = typeof o.intent === "string" ? o.intent.trim().slice(0, MAX_INTENT) : "";
    if (!intent) return null;
    return {
      intent,
      answers: cleanAnswers(o.answers),
      savedAt: typeof o.savedAt === "string" ? o.savedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Let it go. Called once the idea has become a real Build on the account —
 * leaving it behind would mean the next visit offers to "keep" something that
 * is already kept.
 */
export function clearDraft(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // Nothing to do: a draft we cannot clear is still only this tab, this visit.
  }
}
