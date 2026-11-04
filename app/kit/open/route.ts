import { NextRequest, NextResponse } from "next/server";
import { allow } from "../../lib/rateLimit";
import { checkKitAccessFromEnv, KIT_COOKIE, kitCookieOptions } from "../../kit/kitStripe";

export const runtime = "nodejs";

// Stripe sends buyers here after paying, and the buyer's saved kit link points
// here too. The session id is checked with Stripe every time; this browser is
// remembered only when that check passes. Nothing is stored on the server.
export async function GET(req: NextRequest) {
  const to = (path: string) => {
    const res = NextResponse.redirect(new URL(path, req.url), 303);
    res.headers.set("Referrer-Policy", "no-referrer");
    res.headers.set("Cache-Control", "no-store");
    return res;
  };

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`kit-open:${ip}`, 30, 10 * 60_000)) return to("/kit?state=busy");

  const access = await checkKitAccessFromEnv(req.nextUrl.searchParams.get("session_id"));
  switch (access.state) {
    case "paid":
    case "processing": {
      const res = to(access.state === "paid" ? "/kit?welcome=1" : "/kit");
      res.cookies.set(KIT_COOKIE, access.sessionId, kitCookieOptions());
      return res;
    }
    case "refunded": {
      const res = to("/kit?state=refunded");
      res.cookies.set(KIT_COOKIE, "", { ...kitCookieOptions(), maxAge: 0 });
      return res;
    }
    default:
      return to(`/kit?state=${access.state}`);
  }
}
