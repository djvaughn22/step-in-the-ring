import { NextRequest, NextResponse } from "next/server";
import { requestAccountDeletion, MEMBER_SESSION_COOKIE } from "../../../members/auth";
import { memberFromRequest } from "../../../members/session";
import { getMemberStore } from "../../../members/store";

export const runtime = "nodejs";

// Marks the signed-in account for deletion and ends its sessions. Final
// removal follows the owner-approved retention policy. Can only ever act on
// the authenticated account — no target parameter exists.
export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  await requestAccountDeletion(store, ctx.user.id);
  const res = NextResponse.json({
    ok: true,
    message:
      "Deletion requested. Your sessions are ended; data is removed under the published retention policy.",
  });
  res.cookies.set(MEMBER_SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
