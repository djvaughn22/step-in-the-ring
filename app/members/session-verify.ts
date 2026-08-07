import { cookies } from "next/headers";
import { MEMBER_SESSION_COOKIE } from "./auth";
import { getMemberStore } from "./store";
import { resolveAccess } from "./entitlement";

export interface MemberSession {
  userId: string;
  email: string;
  status: string;
  memberAccess: boolean;
}

/** Verify member session cookie and resolve entitlement. Returns null if not authenticated or not approved. */
export async function verifyMemberSession(): Promise<MemberSession | null> {
  const store = await getMemberStore();
  if (!store) return null;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(MEMBER_SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  // Verify session exists and is not expired
  const { hashSessionToken } = await import("./auth");
  const tokenHash = hashSessionToken(sessionToken);
  const session = await store.getSession(tokenHash);
  if (!session) return null;

  const expiresAt = new Date(session.expiresAt);
  if (expiresAt.getTime() < Date.now()) return null;

  // Get user
  const user = await store.getUserById(session.userId);
  if (!user) return null;

  // Get entitlement and check approval
  const entitlement = await store.getEntitlement(session.userId);
  const access = resolveAccess(entitlement);

  // Only allow active/owner/tester status; reject pending/revoked/expired
  if (!access.memberAccess && access.status !== "owner") {
    return null;
  }

  return {
    userId: session.userId,
    email: user.email,
    status: access.status,
    memberAccess: access.memberAccess,
  };
}

/** Get session or redirect to login. Use in Server Components. Throws if not authenticated. */
export async function requireMemberSession(): Promise<MemberSession> {
  const session = await verifyMemberSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/members/login");
  }
  return session as MemberSession;
}
