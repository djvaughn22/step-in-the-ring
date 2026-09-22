import { NextRequest, NextResponse } from "next/server";
import { dfdOwnerGate } from "../../../../uat/digital-front-desk/lib/apiGate";
import { clearAll, exportSnapshot, loadSeedData, stats } from "../../../../uat/digital-front-desk/lib/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = dfdOwnerGate(req);
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  if (searchParams.get("export") === "1") {
    return NextResponse.json({ ok: true, snapshot: exportSnapshot() });
  }
  return NextResponse.json({ ok: true, stats: stats() });
}

export async function POST(req: NextRequest) {
  const denied = dfdOwnerGate(req);
  if (denied) return denied;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  switch (body.action) {
    case "seed": {
      const added = loadSeedData();
      return NextResponse.json({ ok: true, added, stats: stats() });
    }
    case "reset": {
      clearAll();
      return NextResponse.json({ ok: true, stats: stats() });
    }
    default:
      return NextResponse.json({ ok: false, error: "Unrecognized action." }, { status: 422 });
  }
}
