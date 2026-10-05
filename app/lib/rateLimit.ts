// Best-effort, in-memory rate limit for the public write endpoints (usage
// counts, visitor feedback). The key (an IP) lives only in this process's
// memory for the length of the window and is never stored or logged. On a
// serverless platform each instance keeps its own window, which is fine:
// this stops a single script hammering one instance, not a determined attack.

const buckets = new Map<string, { start: number; n: number }>();

export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now - b.start > windowMs) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || now - b.start > windowMs) {
    buckets.set(key, { start: now, n: 1 });
    return true;
  }
  b.n += 1;
  return b.n <= limit;
}

export function resetRateLimits(): void {
  buckets.clear();
}
