import { NextRequest, NextResponse } from "next/server";
import { memberFromRequest } from "../../../../../members/session";
import { getMemberStore } from "../../../../../members/store";
import { exportProject } from "../../../../../members/projects";

export const runtime = "nodejs";

// Export works for the project's owner regardless of paid status — a
// customer's work is never held hostage by a lapsed membership.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  const result = await exportProject(store, ctx.user.id, id);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return new NextResponse(result.value.json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${result.value.filename}"`,
      "Cache-Control": "no-store, private",
    },
  });
}
