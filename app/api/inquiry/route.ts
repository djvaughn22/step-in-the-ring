// Request a project. Anyone can send one; nothing is accepted automatically.
// Validation lives in app/members/projectInquiry.ts.
//
// Answers "ok" ONLY after the request is saved. The owner email is a second
// copy, sent after the response; if it fails, the request is still in the
// database and on /owner/inquiries. Nothing typed is ever logged.

import { after, NextRequest, NextResponse } from "next/server";
import { getMemberStore } from "../../members/store";
import { buildInquiryMail, createProjectInquiry, type InquiryInput } from "../../members/projectInquiry";
import { resendSender } from "../../members/login-notification";
import { allow } from "../../lib/rateLimit";

export const runtime = "nodejs";

const FALLBACK = "Email ask@openmirrorllc.com instead, and we'll reply there.";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`inquiry:${ip}`, 4, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: "That's several requests at once. Try again in a few minutes." }, { status: 429 });
  }

  const store = await getMemberStore();
  if (!store) {
    return NextResponse.json({ ok: false, error: `Requests can't be received here right now. ${FALLBACK}` }, { status: 503 });
  }

  // The form posts JSON from the page script. Without the script it posts a
  // plain form, and gets a plain page back.
  const isForm = !(req.headers.get("content-type") ?? "").includes("application/json");
  let body: InquiryInput = {};
  try {
    body = isForm ? (Object.fromEntries((await req.formData()).entries()) as InquiryInput) : ((await req.json()) as InquiryInput);
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  let result;
  try {
    result = await createProjectInquiry(store, body);
  } catch {
    return NextResponse.json({ ok: false, error: `That didn't save. ${FALLBACK}` }, { status: 500 });
  }
  if (!result.ok) {
    if (isForm) {
      const list = Object.values(result.fields ?? {}).map((m) => `<li>${escapeHtml(m ?? "")}</li>`).join("");
      return plainPage("A few things need a look", `<ul>${list}</ul><p>Go back, fix them, and send it again.</p>`, result.status);
    }
    return NextResponse.json({ ok: false, error: result.error, fields: result.fields }, { status: result.status });
  }

  const stored = result.stored;
  if (stored) {
    const send = async () => {
      try {
        await store.recordEvent({ event: "project-request", source: stored.service, createdAt: stored.createdAt });
        const sender = resendSender();
        if (sender) await sender(buildInquiryMail(stored));
        else console.error("[project-request] owner email not configured; request saved");
      } catch (err) {
        console.error("[project-request] follow-up failed:", err instanceof Error ? err.message : "unknown error");
      }
    };
    try {
      after(send);
    } catch {
      await send();
    }
  }
  if (isForm) {
    return plainPage(
      "Thanks. We have your request.",
      "<p>We reply by email, usually within two business days. Nothing is booked or charged until you approve a written quote.</p>",
      200,
    );
  }
  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function plainPage(title: string, body: string, status: number) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} | Step In The Ring</title><style>body{font:17px/1.6 system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;background:#08182B;color:#EAF1F8}a{color:#2BA6FF}</style></head><body><h1>${escapeHtml(title)}</h1>${body}<p><a href="/services">Back to services</a></p></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
