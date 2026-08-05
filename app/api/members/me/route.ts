import { NextRequest, NextResponse } from "next/server";
import { memberFromRequest } from "../../../members/session";
import { memberStoreConfigured } from "../../../members/store";

export const runtime = "nodejs";

// Public shape only: no billing identifiers, no admin notes, no hashes.
export async function GET(req: NextRequest) {
  if (!memberStoreConfigured()) {
    return NextResponse.json({ configured: false, signedIn: false });
  }
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ configured: true, signedIn: false });
  return NextResponse.json({
    configured: true,
    signedIn: true,
    email: ctx.user.email,
    membership: {
      status: ctx.access.status,
      memberAccess: ctx.access.memberAccess,
      activeUntil: ctx.access.activeUntil,
    },
  });
}
