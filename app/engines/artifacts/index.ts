// One entry point: engine id + answers → the artifact that engine promises.
import { buildArtifact } from "./build";
import { fixArtifact } from "./fix";
import { growArtifact, launchArtifact, sellArtifact } from "./market";
import { planArtifact } from "./plan";
import type { EngineArtifact } from "./types";
import type { Answers } from "./text";

export type { EngineArtifact } from "./types";
export { artifactToMarkdown } from "./types";
export { IDK, isUnknown } from "./text";

const BY_ENGINE: Record<string, (a: Answers, now: Date) => EngineArtifact> = {
  build: (a) => buildArtifact(a),
  fix: (a) => fixArtifact(a),
  plan: (a, now) => planArtifact(a, now),
  sell: (a) => sellArtifact(a),
  launch: (a, now) => launchArtifact(a, now),
  grow: (a) => growArtifact(a),
};

export function hasArtifact(engineId: string): boolean {
  return engineId in BY_ENGINE;
}

export function engineArtifact(engineId: string, answers: Answers, now: Date = new Date()): EngineArtifact | null {
  const fn = BY_ENGINE[engineId];
  return fn ? fn(answers, now) : null;
}
