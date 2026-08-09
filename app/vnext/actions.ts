// ─────────────────────────────────────────────────────────────────────────────
// BUILD ACTIONS — the only way a Build changes.
//
// Every transition is a pure function of (build, action, now). The API route
// applies these SERVER-side: the browser sends what it wants to happen, never
// a finished record. That is the difference between a state machine and a
// text box — a client cannot write itself into "Live".
//
// Laws:
//   - `intent` is never edited here. It is the person's own words.
//   - History is append-only. Nothing rewrites or removes an event.
//   - A stage can move in either direction (work goes backwards sometimes and
//     saying so honestly matters), but it always leaves a history entry.
//   - An unknown action is refused, not ignored.
// ─────────────────────────────────────────────────────────────────────────────

import {
  advance, recordCapabilityUse, BUILD_STAGES, BUILD_STAGE_LABEL,
  type BuildRecordV1, type BuildStage,
} from "./build";
import { capabilityById } from "./capabilities";

export type BuildAction =
  | { type: "advance"; stage: BuildStage; note?: string }
  | { type: "set-action"; currentAction: string }
  | { type: "note"; note: string }
  | { type: "use-capability"; capabilityId: string }
  | { type: "add-artifact"; label: string; ref: string }
  | { type: "shape"; goal?: string; audience?: string; constraints?: string };

export type ActionResult =
  | { ok: true; build: BuildRecordV1 }
  | { ok: false; error: string; status: number };

const MAX_TEXT = 600;

function text(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const clean = raw.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean || clean.length > MAX_TEXT) return null;
  return clean;
}

/** Read an action off an untrusted request body. Returns null when it isn't one. */
export function parseAction(raw: unknown): BuildAction | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  switch (r.type) {
    case "advance": {
      if (!BUILD_STAGES.includes(r.stage as BuildStage)) return null;
      const note = text(r.note);
      return { type: "advance", stage: r.stage as BuildStage, ...(note ? { note } : {}) };
    }
    case "set-action": {
      const currentAction = text(r.currentAction);
      return currentAction ? { type: "set-action", currentAction } : null;
    }
    case "note": {
      const note = text(r.note);
      return note ? { type: "note", note } : null;
    }
    case "use-capability": {
      const capabilityId = text(r.capabilityId);
      return capabilityId ? { type: "use-capability", capabilityId } : null;
    }
    case "add-artifact": {
      const label = text(r.label);
      const ref = text(r.ref);
      return label && ref ? { type: "add-artifact", label, ref } : null;
    }
    case "shape": {
      const goal = text(r.goal) ?? undefined;
      const audience = text(r.audience) ?? undefined;
      const constraints = text(r.constraints) ?? undefined;
      if (!goal && !audience && !constraints) return null;
      return { type: "shape", goal, audience, constraints };
    }
    default:
      return null;
  }
}

export function applyAction(
  build: BuildRecordV1,
  action: BuildAction,
  now: string = new Date().toISOString(),
): ActionResult {
  switch (action.type) {
    case "advance": {
      const note = action.note ?? `Moved to ${BUILD_STAGE_LABEL[action.stage]}.`;
      return { ok: true, build: advance(build, action.stage, note, now) };
    }
    case "set-action":
      return {
        ok: true,
        build: { ...build, currentAction: action.currentAction, updatedAt: now },
      };
    case "note":
      return {
        ok: true,
        build: { ...build, updatedAt: now, history: [...build.history, { at: now, note: action.note }] },
      };
    case "use-capability": {
      const capability = capabilityById(action.capabilityId);
      if (!capability) return { ok: false, error: "Unknown capability.", status: 422 };
      const used = recordCapabilityUse(build, action.capabilityId, now);
      if (used === build) return { ok: true, build }; // already recorded, no noise
      return {
        ok: true,
        build: {
          ...used,
          history: [...used.history, { at: now, note: `Opened ${capability.name}.` }],
        },
      };
    }
    case "add-artifact":
      return {
        ok: true,
        build: {
          ...build,
          updatedAt: now,
          artifacts: [
            ...build.artifacts,
            { id: `${now}-${build.artifacts.length}`, label: action.label, ref: action.ref, kind: "link", createdAt: now },
          ],
          history: [...build.history, { at: now, note: `Added ${action.label}.` }],
        },
      };
    case "shape": {
      const shaped: BuildRecordV1 = {
        ...build,
        updatedAt: now,
        ...(action.goal ? { goal: action.goal } : {}),
        ...(action.audience ? { audience: action.audience } : {}),
        ...(action.constraints ? { constraints: action.constraints } : {}),
      };
      // Saying what version one is IS the shaping work — record the move once.
      if (build.stage === "bring") {
        return { ok: true, build: advance(shaped, "shape", "You started shaping it.", now) };
      }
      return { ok: true, build: shaped };
    }
  }
}
