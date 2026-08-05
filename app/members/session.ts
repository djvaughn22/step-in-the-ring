// Server-side member session helpers shared by pages and API routes.
// Mirrors app/owner/session.ts: pages call currentMember(); route handlers
// call memberFromRequest(req). The member cookie is completely separate from
// the owner cookie.

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { MEMBER_SESSION_COOKIE, sessionUser } from "./auth";
import { resolveAccess, type ResolvedAccess } from "./entitlement";
import { getMemberStore } from "./store";
import type { UserRecord } from "./store";

export interface MemberContext {
  user: UserRecord;
  access: ResolvedAccess;
}

async function contextFor(token: string | undefined): Promise<MemberContext | null> {
  const store = await getMemberStore();
  if (!store || !token) return null;
  const user = await sessionUser(store, token);
  if (!user) return null;
  const access = resolveAccess(await store.getEntitlement(user.id));
  return { user, access };
}

/** For server components. Null when logged out or membership is unconfigured. */
export async function currentMember(): Promise<MemberContext | null> {
  const jar = await cookies();
  return contextFor(jar.get(MEMBER_SESSION_COOKIE)?.value);
}

/** For API route handlers. */
export async function memberFromRequest(req: NextRequest): Promise<MemberContext | null> {
  return contextFor(req.cookies.get(MEMBER_SESSION_COOKIE)?.value);
}

export function memberCookieOptions(expiresAt: string) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt),
  };
}
