// Server-only feature flag. No NEXT_PUBLIC_ prefix on purpose — this must
// never ship into a client bundle (source-hygiene.test.ts would catch a
// NEXT_PUBLIC_*_SECRET/PASSWORD/TOKEN/KEY var, but a plain boolean flag
// leaking client-side would still be a needless disclosure of an unlaunched
// feature's existence). Read it fresh each call rather than caching, so a
// test can flip process.env between assertions.
export function dfdUatEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.DIGITAL_FRONT_DESK_UAT_ENABLED === "true";
}
