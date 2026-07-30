// Game Engine privileges — WHO may publish a game to a live platform.
//
// The real boundary is the shared owner session: the publish API
// (app/api/engines/games/publish/route.ts) rejects any request without a
// valid owner cookie before reading the body, and the whole Engine Room UI
// sits behind the server-side owner gate. These role helpers only shape the
// UI for whoever is already inside; if visitor roles ever return, enforce
// them server-side in the publish route as well, never only here.

export type GameRole = "player" | "builder" | "publisher";

export function currentRole(): GameRole {
  return "publisher"; // inside the owner gate, the owner has full privileges
}

export function canBuild(): boolean {
  return true;
}

export function canPublish(): boolean {
  return currentRole() === "publisher";
}

export const PRIVILEGE_NOTE =
  "The Engine Room is owner-only; publishing also re-checks the owner session on the server.";
