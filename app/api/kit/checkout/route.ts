import { NextRequest, NextResponse } from "next/server";
import { allow } from "../../../lib/rateLimit";
import { kitFileReady } from "../../../kit/kitFile";
import { getKitGateway, kitSalesOpen, readKitConfig, startKitCheckout } from "../../../kit/kitStripe";

export const runtime = "nodejs";

// The Buy button is a plain form POST, so it works without JavaScript. The
// browser only ever receives a redirect: price, product and return URLs are
// decided here, never client-side.
function backToKit(req: NextRequest, checkout: string) {
  return NextResponse.redirect(new URL(`/products/ready-to-build?checkout=${checkout}#kit`, req.url), 303);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`kit-checkout:${ip}`, 10, 10 * 60_000)) return backToKit(req, "busy");

  const config = readKitConfig();
  if (!kitSalesOpen(config)) return backToKit(req, "closed");

  const gateway = await getKitGateway(config.secretKey!);
  const result = await startKitCheckout(gateway, config, kitFileReady);
  if (!result.ok) {
    // For the owner's logs only: which setup step is missing. Never a secret.
    console.error(`[kit] checkout did not start: ${result.reason}`);
    return backToKit(req, "unavailable");
  }
  return NextResponse.redirect(result.url, 303);
}
