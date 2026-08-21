// The shared preview door's only endpoint. The passcode is compared on the
// server and never travels back to the browser in any form — the response is
// a bare ok/not-ok plus an HttpOnly cookie.
//
// POST { passcode, returnTo? } → sets the preview session cookie.
// DELETE                       → clears it.

import { NextRequest, NextResponse } from "next/server";
import {
  PREVIEW_COOKIE,
  checkPasscode,
  previewCookieOptions,
} from "../../preview/previewAuth";
import { previewPaths } from "../../site/registry";

export const dynamic = "force-dynamic";

/** Only a path the registry actually marks as a preview page is accepted. */
function safeReturnTo(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return previewPaths().includes(value) ? value : null;
}

function rateKey(req: NextRequest): string {
  // Best effort. Behind a proxy this is the forwarded client address; with no
  // header at all everyone shares one bucket, which throttles harder, not less.
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "").trim() || "unknown";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "wrong" }, { status: 400 });
  }

  const passcode =
    body && typeof body === "object" && "passcode" in body
      ? String((body as { passcode: unknown }).passcode ?? "")
      : "";

  if (!passcode) {
    return NextResponse.json({ ok: false, reason: "wrong" }, { status: 400 });
  }

  const result = checkPasscode(passcode, rateKey(req));

  if (!result.ok) {
    const status = result.reason === "rate-limited" ? 429 : 401;
    return NextResponse.json({ ok: false, reason: result.reason }, { status });
  }

  const returnTo =
    body && typeof body === "object" && "returnTo" in body
      ? safeReturnTo((body as { returnTo: unknown }).returnTo)
      : null;

  const res = NextResponse.json({ ok: true, returnTo });
  res.cookies.set(PREVIEW_COOKIE, result.token, previewCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PREVIEW_COOKIE, "", { ...previewCookieOptions(), maxAge: 0 });
  return res;
}
