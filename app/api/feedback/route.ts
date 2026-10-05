// Public feedback: anyone can send a note, no account needed.
// Validation lives in app/members/visitorFeedback.ts.

import { after, NextRequest, NextResponse } from "next/server";
import { getMemberStore } from "../../members/store";
import { buildVisitorFeedbackMail, createVisitorFeedback } from "../../members/visitorFeedback";
import { resendSender } from "../../members/login-notification";
import { allow } from "../../lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`feedback:${ip}`, 6, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: "That's a lot of notes at once. Try again in a few minutes." }, { status: 429 });
  }

  const store = await getMemberStore();
  if (!store) {
    return NextResponse.json(
      { ok: false, error: "Feedback isn't switched on here. Email ask@openmirrorllc.com instead." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  let result;
  try {
    result = await createVisitorFeedback(store, {
      category: body.category,
      message: body.message,
      contextUrl: body.contextUrl,
      replyEmail: body.replyEmail,
      website: body.website,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "That didn't save. Email ask@openmirrorllc.com instead." },
      { status: 500 },
    );
  }
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });

  const stored = result.stored;
  if (stored) {
    const send = async () => {
      try {
        await store.recordEvent({ event: "feedback-sent", source: stored.category, createdAt: stored.createdAt });
        const sender = resendSender();
        if (sender) await sender(buildVisitorFeedbackMail(stored));
      } catch (err) {
        console.error("[visitor-feedback] follow-up failed:", err instanceof Error ? err.message : "unknown error");
      }
    };
    try {
      after(send);
    } catch {
      await send();
    }
  }
  return NextResponse.json({ ok: true });
}
