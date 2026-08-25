// Game Engine privileges — WHO may publish a game to a live platform.
//
// The real boundary is the shared owner session: the publish API
// (app/api/engines/games/publish/route.ts) rejects any request without a
// valid owner cookie before reading the body, and that check is what
// actually protects the local OpenDoku repo. These role helpers only shape
// the UI for whoever is looking at it — GameStudio passes down the real
// server-decided isOwner (see app/engines/room/page.tsx → EngineSystem →
// GameStudio) so a non-owner sees an honest disabled button instead of one
// that lies and then 401s. If this ever drifts, enforce the real boundary
// server-side in the publish route, never only here.

export type GameRole = "player" | "builder" | "publisher";

export function currentRole(isOwner: boolean): GameRole {
  return isOwner ? "publisher" : "builder";
}

export function canBuild(): boolean {
  return true;
}

export function canPublish(isOwner: boolean): boolean {
  return currentRole(isOwner) === "publisher";
}

export const PRIVILEGE_NOTE =
  "Publishing to OpenDoku runs on the owner's machine — the server checks the owner session again regardless of what this page shows.";
