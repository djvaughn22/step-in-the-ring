// ─────────────────────────────────────────────────────────────────────────────
// Private tester codes — owner-controlled temporary free access.
//
// Rules (test-locked):
//   - Codes are generated server-side with crypto randomness, shown to the
//     owner exactly ONCE at creation, and stored only as an HMAC hash.
//   - Never hard-coded, never committed, never in a client bundle, never
//     logged after redemption, never reusable beyond maxRedemptions.
//   - Every code expires; redemption grants a time-limited "tester"
//     entitlement ending at the code's expiry.
//   - The owner can revoke a code (stops future redemptions) and revoke a
//     user's grant (ends their access).
//   - Redemption attempts are rate limited.
//   - Owner access is a separate status — never granted through codes.
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { MemberStore, TesterCodeRecord } from "./store";
import { rateLimited, recordAttempt } from "./auth";

// No I/L/O/0/1 — codes can be read aloud without ambiguity.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const GROUPS = 3;
const GROUP_LEN = 4;

export function testerCodeSecret(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const s = env.TESTER_CODE_SECRET;
  return s && s.length >= 16 ? s : null;
}

export function hashTesterCode(code: string, secret: string): string {
  return createHmac("sha256", secret).update(code.trim().toUpperCase()).digest("hex");
}

export function generateTesterCodeValue(): string {
  const bytes = randomBytes(GROUPS * GROUP_LEN);
  let i = 0;
  const groups: string[] = [];
  for (let g = 0; g < GROUPS; g++) {
    let part = "";
    for (let c = 0; c < GROUP_LEN; c++) part += CODE_ALPHABET[bytes[i++] % CODE_ALPHABET.length];
    groups.push(part);
  }
  return `SITR-${groups.join("-")}`;
}

export interface CreatedTesterCode {
  /** The raw code — shown once, never stored, never logged. */
  code: string;
  record: TesterCodeRecord;
}

export async function createTesterCode(
  store: MemberStore,
  secret: string,
  opts: { label: string; maxRedemptions: number; expiresAt: Date; now?: Date },
): Promise<CreatedTesterCode> {
  const now = opts.now ?? new Date();
  const code = generateTesterCodeValue();
  const record: TesterCodeRecord = {
    id: randomUUID(),
    codeHash: hashTesterCode(code, secret),
    label: opts.label.slice(0, 120),
    maxRedemptions: Math.max(1, Math.min(100, Math.floor(opts.maxRedemptions))),
    redemptions: 0,
    expiresAt: opts.expiresAt.toISOString(),
    revokedAt: null,
    createdAt: now.toISOString(),
  };
  await store.createTesterCode(record);
  return { code, record };
}

export async function revokeTesterCode(
  store: MemberStore,
  codeId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const codes = await store.listTesterCodes();
  const record = codes.find((c) => c.id === codeId);
  if (!record) return false;
  await store.updateTesterCode({ ...record, revokedAt: now.toISOString() });
  return true;
}

export type RedeemResult =
  | { ok: true; activeUntil: string }
  | { ok: false; error: string; status: number };

export async function redeemTesterCode(
  store: MemberStore,
  secret: string,
  input: { code: unknown; userId: string; ip: string },
  now: Date = new Date(),
): Promise<RedeemResult> {
  const limiterKey = `tester:${input.ip}`;
  if (rateLimited(limiterKey, now.getTime())) {
    return { ok: false, error: "Too many attempts. Please wait and try again.", status: 429 };
  }
  recordAttempt(limiterKey, now.getTime());

  // One generic failure message — attempts can't probe which part failed.
  const generic = { ok: false as const, error: "That code is not valid.", status: 404 };
  if (typeof input.code !== "string" || input.code.trim().length < 8) return generic;

  const record = await store.getTesterCodeByHash(hashTesterCode(input.code, secret));
  if (!record) return generic;
  if (record.revokedAt) return generic;
  if (new Date(record.expiresAt).getTime() <= now.getTime()) return generic;
  if (record.redemptions >= record.maxRedemptions) return generic;

  const existing = await store.getEntitlement(input.userId);
  if (existing && (existing.status === "active" || existing.status === "owner")) {
    return { ok: false, error: "This account already has full access.", status: 409 };
  }

  await store.updateTesterCode({ ...record, redemptions: record.redemptions + 1 });
  await store.upsertEntitlement({
    userId: input.userId,
    status: "tester",
    source: "tester-code",
    stripeCustomerId: existing?.stripeCustomerId ?? null,
    stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
    currentPeriodEnd: record.expiresAt, // tester access ends when the code does
    testerCodeId: record.id,
    revokedAt: null,
    adminNotes: existing?.adminNotes ?? "",
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  });
  return { ok: true, activeUntil: record.expiresAt };
}

/** Owner action: end one user's tester grant immediately. */
export async function revokeTesterGrant(
  store: MemberStore,
  userId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const entitlement = await store.getEntitlement(userId);
  if (!entitlement || entitlement.status !== "tester") return false;
  await store.upsertEntitlement({
    ...entitlement,
    status: "revoked",
    revokedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  return true;
}
