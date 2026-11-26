// Is this browser signed in as the owner? (Nov 26 2026.) The website editor
// asks, so it can show the owner-only export. Answers yes or no, nothing else.
import { NextResponse, type NextRequest } from "next/server";
import { isOwnerRequest } from "../../../owner/session";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return NextResponse.json({ owner: isOwnerRequest(req) }, { headers: { "cache-control": "no-store" } });
}
