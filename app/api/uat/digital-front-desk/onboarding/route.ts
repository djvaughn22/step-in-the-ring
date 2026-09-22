import { NextRequest, NextResponse } from "next/server";
import { dfdOwnerGate } from "../../../../uat/digital-front-desk/lib/apiGate";
import { validateOnboarding } from "../../../../uat/digital-front-desk/lib/domain";
import { addOnboardingApplication, listOnboardingApplications } from "../../../../uat/digital-front-desk/lib/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = dfdOwnerGate(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, applications: listOnboardingApplications() });
}

export async function POST(req: NextRequest) {
  const denied = dfdOwnerGate(req);
  if (denied) return denied;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, errors: ["Bad request."] }, { status: 400 });
  }

  const result = validateOnboarding({ plan: body.plan, businessName: body.businessName, email: body.email });
  if (!result.ok) return NextResponse.json({ ok: false, errors: result.errors }, { status: 422 });

  const application = addOnboardingApplication(result.value);
  return NextResponse.json({ ok: true, application });
}
