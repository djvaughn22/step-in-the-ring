// Server-side owner session checks shared by every private SITR route.
// Pages call isOwnerAuthed(); API route handlers call isOwnerRequest(req).
// Both read the Author's Room cookie — one session, one logout, everywhere.

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { ownerPassword, SESSION_COOKIE } from "../author/auth";
import { hasOwnerSession } from "./gate";

/** For server components: is this request an authenticated owner? */
export async function isOwnerAuthed(): Promise<boolean> {
  const jar = await cookies();
  return hasOwnerSession(jar.get(SESSION_COOKIE)?.value);
}

/** For API route handlers: is this request an authenticated owner? */
export function isOwnerRequest(req: NextRequest): boolean {
  return hasOwnerSession(req.cookies.get(SESSION_COOKIE)?.value);
}

/** Whether STORY_OWNER_PASSWORD is configured on this deployment. */
export function ownerConfigured(): boolean {
  return !!ownerPassword();
}
