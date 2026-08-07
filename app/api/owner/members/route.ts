import { NextRequest, NextResponse } from "next/server";
import { isOwnerAuthed } from "../../../owner/session";
import { getMemberStore } from "../../../members/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isOwnerAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const store = await getMemberStore();
  if (!store) {
    return NextResponse.json({ ok: false, error: "Store not configured" }, { status: 503 });
  }

  try {
    const users = await store.listUsers();
    const entitlements = await store.listEntitlements();

    const entitlementMap = new Map(entitlements.map(e => [e.userId, e]));
    const members = users.map(u => ({
      userId: u.id,
      email: u.email,
      createdAt: u.createdAt,
      status: entitlementMap.get(u.id)?.status || "free",
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ ok: true, members });
  } catch (err) {
    console.error("Failed to list members:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch members" }, { status: 500 });
  }
}
