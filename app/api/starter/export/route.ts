// Website files, for authorized fulfillment only (owner direction, Nov 25 2026).
//
// The public editor no longer builds or offers a download: the files are the
// paid deliverable, so they're made here, on the server, and only for the
// signed-in owner. A visitor can still browse, preview and customize every
// example in their own browser; the package comes from us.
import { NextResponse, type NextRequest } from "next/server";
import { isOwnerRequest } from "../../../owner/session";
import { parseDraft } from "../../../starter/draft";
import { exportEntries, makeZip, zipName } from "../../../starter/zip";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isOwnerRequest(req)) {
    return NextResponse.json({ ok: false, error: "Website files are prepared by Step In The Ring." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "That draft couldn't be read." }, { status: 400 });
  }
  const draft = parseDraft((body as { draft?: unknown } | null)?.draft);
  if (!draft) {
    return NextResponse.json({ ok: false, error: "That draft couldn't be read." }, { status: 400 });
  }
  const zip = makeZip(exportEntries(draft));
  return new NextResponse(Buffer.from(zip), {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${zipName(draft)}"`,
      "x-file-name": zipName(draft),
      "cache-control": "no-store",
    },
  });
}
