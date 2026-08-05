import { NextRequest, NextResponse } from "next/server";
import { isOwnerRequest } from "../../../owner/session";
import { getMemberStore } from "../../../members/store";
import { createTesterCode, revokeTesterCode, testerCodeSecret } from "../../../members/testerCodes";

export const runtime = "nodejs";

// Owner-only tester-code management. Uses the existing shared owner session —
// tester access and owner access never mix. The raw code appears exactly once
// in the creation response and is never stored or logged.

function ownerGate(req: NextRequest) {
  if (!isOwnerRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const denied = ownerGate(req);
  if (denied) return denied;
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "No database configured." }, { status: 503 });
  const codes = await store.listTesterCodes();
  // Hashes stay server-side; the listing shows only administrative fields.
  return NextResponse.json({
    ok: true,
    codes: codes.map((c) => ({
      id: c.id,
      label: c.label,
      maxRedemptions: c.maxRedemptions,
      redemptions: c.redemptions,
      expiresAt: c.expiresAt,
      revokedAt: c.revokedAt,
      createdAt: c.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const denied = ownerGate(req);
  if (denied) return denied;
  const store = await getMemberStore();
  const secret = testerCodeSecret();
  if (!store || !secret) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL and TESTER_CODE_SECRET must be configured." },
      { status: 503 },
    );
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const days = Math.max(1, Math.min(90, Number(body.expiresInDays) || 14));
  const created = await createTesterCode(store, secret, {
    label: typeof body.label === "string" ? body.label : "",
    maxRedemptions: Number(body.maxRedemptions) || 1,
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });
  // The one and only time the raw code leaves the server.
  return NextResponse.json({
    ok: true,
    code: created.code,
    id: created.record.id,
    expiresAt: created.record.expiresAt,
    maxRedemptions: created.record.maxRedemptions,
  });
}

export async function DELETE(req: NextRequest) {
  const denied = ownerGate(req);
  if (denied) return denied;
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "No database configured." }, { status: 503 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id." }, { status: 422 });
  const revoked = await revokeTesterCode(store, id);
  return NextResponse.json({ ok: revoked });
}
