import { NextRequest, NextResponse } from "next/server";
import { getKitFileSource } from "../../kit/kitFile";
import { checkKitAccessFromEnv, KIT_COOKIE } from "../../kit/kitStripe";

export const runtime = "nodejs";

// The only way the kit PDF leaves the server: a browser holding a kit cookie
// whose purchase Stripe confirms right now. Anyone else is sent to /kit,
// which explains how to get in.
export async function GET(req: NextRequest) {
  const access = await checkKitAccessFromEnv(req.cookies.get(KIT_COOKIE)?.value);
  if (access.state !== "paid") return NextResponse.redirect(new URL("/kit", req.url), 303);

  let file = null;
  try {
    file = await (await getKitFileSource())?.load();
  } catch {
    file = null;
  }
  if (!file) return NextResponse.redirect(new URL("/kit?file=missing", req.url), 303);

  const name = file.filename.replace(/[^A-Za-z0-9._-]/g, "-") || "Ready-to-Build-Kit.pdf";
  return new NextResponse(new Uint8Array(file.bytes), {
    status: 200,
    headers: {
      "Content-Type": file.contentType || "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Length": String(file.bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}
