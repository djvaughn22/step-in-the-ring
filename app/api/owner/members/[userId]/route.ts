import { NextRequest, NextResponse } from "next/server";
import { isOwnerAuthed } from "../../../../owner/session";
import { getMemberStore } from "../../../../members/store";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  if (!(await isOwnerAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const store = await getMemberStore();
  if (!store) {
    return NextResponse.json({ ok: false, error: "Store not configured" }, { status: 503 });
  }

  const { userId } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  const action = body.action as string;
  if (!action || !["approve", "revoke"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  }

  try {
    const entitlement = await store.getEntitlement(userId);
    if (!entitlement) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    let newStatus: "active" | "revoked";
    if (action === "approve") {
      newStatus = "active";
    } else {
      newStatus = "revoked";
    }

    await store.upsertEntitlement({
      ...entitlement,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      adminNotes: entitlement.adminNotes + `\n[${new Date().toISOString()}] ${action}ed by owner`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update member:", err);
    return NextResponse.json({ ok: false, error: "Failed to update member" }, { status: 500 });
  }
}
