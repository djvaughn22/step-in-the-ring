// Game Engine privileges — WHO may publish a game to a live platform.
//
// BUILD PHASE (now): everyone who is past the Engine Room access gate gets
// full privileges, so the whole pipeline can be tested end to end.
//
// LATER (DJ adds): map Engine Room access codes to roles here — e.g.
// { "2323": "publisher", "4444": "builder" } — and enforce the same check
// server-side in app/api/engines/games/publish/route.ts before any push.
// Publishing only works where a publish driver is configured (the local
// opendoku repo today; a GITHUB_TOKEN driver for production later), so the
// open stub cannot push from stepinthering.com in the meantime.

export type GameRole = "player" | "builder" | "publisher";

export function currentRole(): GameRole {
  return "publisher"; // build phase: everyone
}

export function canBuild(): boolean {
  return true;
}

export function canPublish(): boolean {
  return currentRole() === "publisher";
}

export const PRIVILEGE_NOTE =
  "Build phase: everyone with Engine Room access can publish while we test the pipeline. Roles per access code come later.";
