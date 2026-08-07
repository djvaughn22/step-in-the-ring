// ─────────────────────────────────────────────────────────────────────────────
// Member store — the ONE persistence interface for customer accounts,
// sessions, entitlements, projects, tester codes, and Stripe event
// idempotency. Two implementations:
//
//   MemoryMemberStore — tests and local development without a database.
//   PgMemberStore     — production (Neon Postgres via DATABASE_URL).
//
// Every server core (auth, entitlement, stripe, testerCodes, projects) takes
// a MemberStore, so the whole membership system is testable without touching
// a real database or Stripe.
//
// Fail-closed rule: with no DATABASE_URL, getMemberStore() returns null and
// every membership API answers 503 with an honest "private beta being
// prepared" message. Nothing pretends to work.
// ─────────────────────────────────────────────────────────────────────────────

export type EntitlementStatus =
  | "free"
  | "active" // paid, current
  | "tester" // tester-code grant
  | "owner"
  | "past_due"
  | "canceled_active" // canceled but paid through period end
  | "expired"
  | "revoked";

export interface UserRecord {
  id: string;
  email: string; // stored lowercase
  passwordHash: string; // scrypt, never plaintext
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  deletionRequestedAt: string | null;
}

export interface SessionRecord {
  tokenHash: string; // sha256 of the opaque token — raw token never stored
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface EntitlementRecord {
  userId: string;
  status: EntitlementStatus;
  source: "stripe" | "tester-code" | "owner-grant" | "none";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  testerCodeId: string | null;
  revokedAt: string | null;
  adminNotes: string; // private, never in API responses
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRecord {
  id: string;
  userId: string;
  title: string;
  engineId: string;
  content: string; // JSON payload, size-limited by the projects core
  createdAt: string;
  updatedAt: string;
}

export interface TesterCodeRecord {
  id: string;
  codeHash: string; // HMAC of the code — raw code never stored
  label: string; // owner note, e.g. "family test round 1"
  maxRedemptions: number;
  redemptions: number;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface AnalyticsEvent {
  event: string;
  source: string;
  createdAt: string;
}

export type FeedbackCategory = "bug" | "confusing" | "idea" | "other";
export type FeedbackStatus = "new" | "reviewed";

export interface FeedbackRecord {
  id: string;
  userId: string;
  category: FeedbackCategory;
  message: string;
  contextUrl: string; // where the person was when they submitted, e.g. "/engines?engine=idea"
  status: FeedbackStatus;
  createdAt: string;
}

export interface MemberStore {
  // users
  createUser(u: UserRecord): Promise<void>;
  getUserByEmail(email: string): Promise<UserRecord | null>;
  getUserById(id: string): Promise<UserRecord | null>;
  updateUser(u: UserRecord): Promise<void>;
  // sessions
  createSession(s: SessionRecord): Promise<void>;
  getSession(tokenHash: string): Promise<SessionRecord | null>;
  deleteSession(tokenHash: string): Promise<void>;
  deleteSessionsForUser(userId: string): Promise<void>;
  // entitlements
  getEntitlement(userId: string): Promise<EntitlementRecord | null>;
  upsertEntitlement(e: EntitlementRecord): Promise<void>;
  getEntitlementByStripeCustomer(customerId: string): Promise<EntitlementRecord | null>;
  // projects
  createProject(p: ProjectRecord): Promise<void>;
  getProject(id: string): Promise<ProjectRecord | null>;
  listProjects(userId: string): Promise<ProjectRecord[]>;
  updateProject(p: ProjectRecord): Promise<void>;
  deleteProject(id: string): Promise<void>;
  // tester codes
  createTesterCode(c: TesterCodeRecord): Promise<void>;
  getTesterCodeByHash(codeHash: string): Promise<TesterCodeRecord | null>;
  listTesterCodes(): Promise<TesterCodeRecord[]>;
  updateTesterCode(c: TesterCodeRecord): Promise<void>;
  // stripe idempotency — returns false if the event was already recorded
  recordStripeEvent(eventId: string): Promise<boolean>;
  // analytics (non-sensitive counters only)
  recordEvent(e: AnalyticsEvent): Promise<void>;
  // structured tester feedback
  createFeedback(f: FeedbackRecord): Promise<void>;
  listFeedback(): Promise<FeedbackRecord[]>;
  updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void>;
}

// ── In-memory implementation (tests / no-database dev) ──────────────────────

export class MemoryMemberStore implements MemberStore {
  users = new Map<string, UserRecord>();
  sessions = new Map<string, SessionRecord>();
  entitlements = new Map<string, EntitlementRecord>();
  projects = new Map<string, ProjectRecord>();
  testerCodes = new Map<string, TesterCodeRecord>();
  stripeEvents = new Set<string>();
  events: AnalyticsEvent[] = [];
  feedback = new Map<string, FeedbackRecord>();

  async createUser(u: UserRecord) {
    if ([...this.users.values()].some((x) => x.email === u.email)) {
      throw new Error("duplicate email");
    }
    this.users.set(u.id, { ...u });
  }
  async getUserByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }
  async getUserById(id: string) {
    return this.users.get(id) ?? null;
  }
  async updateUser(u: UserRecord) {
    this.users.set(u.id, { ...u });
  }
  async createSession(s: SessionRecord) {
    this.sessions.set(s.tokenHash, { ...s });
  }
  async getSession(tokenHash: string) {
    return this.sessions.get(tokenHash) ?? null;
  }
  async deleteSession(tokenHash: string) {
    this.sessions.delete(tokenHash);
  }
  async deleteSessionsForUser(userId: string) {
    for (const [k, s] of this.sessions) if (s.userId === userId) this.sessions.delete(k);
  }
  async getEntitlement(userId: string) {
    return this.entitlements.get(userId) ?? null;
  }
  async upsertEntitlement(e: EntitlementRecord) {
    this.entitlements.set(e.userId, { ...e });
  }
  async getEntitlementByStripeCustomer(customerId: string) {
    return (
      [...this.entitlements.values()].find((e) => e.stripeCustomerId === customerId) ?? null
    );
  }
  async createProject(p: ProjectRecord) {
    this.projects.set(p.id, { ...p });
  }
  async getProject(id: string) {
    return this.projects.get(id) ?? null;
  }
  async listProjects(userId: string) {
    return [...this.projects.values()]
      .filter((p) => p.userId === userId)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }
  async updateProject(p: ProjectRecord) {
    this.projects.set(p.id, { ...p });
  }
  async deleteProject(id: string) {
    this.projects.delete(id);
  }
  async createTesterCode(c: TesterCodeRecord) {
    this.testerCodes.set(c.id, { ...c });
  }
  async getTesterCodeByHash(codeHash: string) {
    return [...this.testerCodes.values()].find((c) => c.codeHash === codeHash) ?? null;
  }
  async listTesterCodes() {
    return [...this.testerCodes.values()];
  }
  async updateTesterCode(c: TesterCodeRecord) {
    this.testerCodes.set(c.id, { ...c });
  }
  async recordStripeEvent(eventId: string) {
    if (this.stripeEvents.has(eventId)) return false;
    this.stripeEvents.add(eventId);
    return true;
  }
  async recordEvent(e: AnalyticsEvent) {
    this.events.push({ ...e });
  }
  async createFeedback(f: FeedbackRecord) {
    this.feedback.set(f.id, { ...f });
  }
  async listFeedback() {
    return [...this.feedback.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async updateFeedbackStatus(id: string, status: FeedbackStatus) {
    const existing = this.feedback.get(id);
    if (existing) this.feedback.set(id, { ...existing, status });
  }
}

// ── Postgres implementation ─────────────────────────────────────────────────
// Schema in migrations/001_membership.sql. Uses the pg Pool lazily so builds
// and tests never open a connection.

type PgPool = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
};

export class PgMemberStore implements MemberStore {
  constructor(private pool: PgPool) {}

  private one<T>(rows: Record<string, unknown>[], map: (r: Record<string, unknown>) => T): T | null {
    return rows.length ? map(rows[0]) : null;
  }

  private mapUser = (r: Record<string, unknown>): UserRecord => ({
    id: String(r.id),
    email: String(r.email),
    passwordHash: String(r.password_hash),
    emailVerified: Boolean(r.email_verified),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    deletionRequestedAt: r.deletion_requested_at ? String(r.deletion_requested_at) : null,
  });

  async createUser(u: UserRecord) {
    await this.pool.query(
      `INSERT INTO member_users (id, email, password_hash, email_verified, created_at, updated_at, deletion_requested_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [u.id, u.email, u.passwordHash, u.emailVerified, u.createdAt, u.updatedAt, u.deletionRequestedAt],
    );
  }
  async getUserByEmail(email: string) {
    const { rows } = await this.pool.query(`SELECT * FROM member_users WHERE email = $1`, [email]);
    return this.one(rows, this.mapUser);
  }
  async getUserById(id: string) {
    const { rows } = await this.pool.query(`SELECT * FROM member_users WHERE id = $1`, [id]);
    return this.one(rows, this.mapUser);
  }
  async updateUser(u: UserRecord) {
    await this.pool.query(
      `UPDATE member_users SET email=$2, password_hash=$3, email_verified=$4, updated_at=$5, deletion_requested_at=$6 WHERE id=$1`,
      [u.id, u.email, u.passwordHash, u.emailVerified, u.updatedAt, u.deletionRequestedAt],
    );
  }
  async createSession(s: SessionRecord) {
    await this.pool.query(
      `INSERT INTO member_sessions (token_hash, user_id, expires_at, created_at) VALUES ($1,$2,$3,$4)`,
      [s.tokenHash, s.userId, s.expiresAt, s.createdAt],
    );
  }
  async getSession(tokenHash: string) {
    const { rows } = await this.pool.query(`SELECT * FROM member_sessions WHERE token_hash = $1`, [tokenHash]);
    return this.one(rows, (r) => ({
      tokenHash: String(r.token_hash),
      userId: String(r.user_id),
      expiresAt: String(r.expires_at),
      createdAt: String(r.created_at),
    }));
  }
  async deleteSession(tokenHash: string) {
    await this.pool.query(`DELETE FROM member_sessions WHERE token_hash = $1`, [tokenHash]);
  }
  async deleteSessionsForUser(userId: string) {
    await this.pool.query(`DELETE FROM member_sessions WHERE user_id = $1`, [userId]);
  }

  private mapEnt = (r: Record<string, unknown>): EntitlementRecord => ({
    userId: String(r.user_id),
    status: String(r.status) as EntitlementStatus,
    source: String(r.source) as EntitlementRecord["source"],
    stripeCustomerId: r.stripe_customer_id ? String(r.stripe_customer_id) : null,
    stripeSubscriptionId: r.stripe_subscription_id ? String(r.stripe_subscription_id) : null,
    currentPeriodEnd: r.current_period_end ? String(r.current_period_end) : null,
    testerCodeId: r.tester_code_id ? String(r.tester_code_id) : null,
    revokedAt: r.revoked_at ? String(r.revoked_at) : null,
    adminNotes: String(r.admin_notes ?? ""),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  });

  async getEntitlement(userId: string) {
    const { rows } = await this.pool.query(`SELECT * FROM member_entitlements WHERE user_id = $1`, [userId]);
    return this.one(rows, this.mapEnt);
  }
  async upsertEntitlement(e: EntitlementRecord) {
    await this.pool.query(
      `INSERT INTO member_entitlements
        (user_id, status, source, stripe_customer_id, stripe_subscription_id, current_period_end, tester_code_id, revoked_at, admin_notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (user_id) DO UPDATE SET
        status=$2, source=$3, stripe_customer_id=$4, stripe_subscription_id=$5,
        current_period_end=$6, tester_code_id=$7, revoked_at=$8, admin_notes=$9, updated_at=$11`,
      [
        e.userId, e.status, e.source, e.stripeCustomerId, e.stripeSubscriptionId,
        e.currentPeriodEnd, e.testerCodeId, e.revokedAt, e.adminNotes, e.createdAt, e.updatedAt,
      ],
    );
  }
  async getEntitlementByStripeCustomer(customerId: string) {
    const { rows } = await this.pool.query(
      `SELECT * FROM member_entitlements WHERE stripe_customer_id = $1`,
      [customerId],
    );
    return this.one(rows, this.mapEnt);
  }

  private mapProject = (r: Record<string, unknown>): ProjectRecord => ({
    id: String(r.id),
    userId: String(r.user_id),
    title: String(r.title),
    engineId: String(r.engine_id),
    content: String(r.content),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  });

  async createProject(p: ProjectRecord) {
    await this.pool.query(
      `INSERT INTO member_projects (id, user_id, title, engine_id, content, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [p.id, p.userId, p.title, p.engineId, p.content, p.createdAt, p.updatedAt],
    );
  }
  async getProject(id: string) {
    const { rows } = await this.pool.query(`SELECT * FROM member_projects WHERE id = $1`, [id]);
    return this.one(rows, this.mapProject);
  }
  async listProjects(userId: string) {
    const { rows } = await this.pool.query(
      `SELECT * FROM member_projects WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId],
    );
    return rows.map(this.mapProject);
  }
  async updateProject(p: ProjectRecord) {
    await this.pool.query(
      `UPDATE member_projects SET title=$2, engine_id=$3, content=$4, updated_at=$5 WHERE id=$1`,
      [p.id, p.title, p.engineId, p.content, p.updatedAt],
    );
  }
  async deleteProject(id: string) {
    await this.pool.query(`DELETE FROM member_projects WHERE id = $1`, [id]);
  }

  private mapCode = (r: Record<string, unknown>): TesterCodeRecord => ({
    id: String(r.id),
    codeHash: String(r.code_hash),
    label: String(r.label),
    maxRedemptions: Number(r.max_redemptions),
    redemptions: Number(r.redemptions),
    expiresAt: String(r.expires_at),
    revokedAt: r.revoked_at ? String(r.revoked_at) : null,
    createdAt: String(r.created_at),
  });

  async createTesterCode(c: TesterCodeRecord) {
    await this.pool.query(
      `INSERT INTO member_tester_codes (id, code_hash, label, max_redemptions, redemptions, expires_at, revoked_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [c.id, c.codeHash, c.label, c.maxRedemptions, c.redemptions, c.expiresAt, c.revokedAt, c.createdAt],
    );
  }
  async getTesterCodeByHash(codeHash: string) {
    const { rows } = await this.pool.query(`SELECT * FROM member_tester_codes WHERE code_hash = $1`, [codeHash]);
    return this.one(rows, this.mapCode);
  }
  async listTesterCodes() {
    const { rows } = await this.pool.query(`SELECT * FROM member_tester_codes ORDER BY created_at DESC`);
    return rows.map(this.mapCode);
  }
  async updateTesterCode(c: TesterCodeRecord) {
    await this.pool.query(
      `UPDATE member_tester_codes SET redemptions=$2, revoked_at=$3, expires_at=$4 WHERE id=$1`,
      [c.id, c.redemptions, c.revokedAt, c.expiresAt],
    );
  }
  async recordStripeEvent(eventId: string) {
    const { rowCount } = await this.pool.query(
      `INSERT INTO member_stripe_events (event_id, created_at) VALUES ($1, now())
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId],
    );
    return (rowCount ?? 0) > 0;
  }
  async recordEvent(e: AnalyticsEvent) {
    await this.pool.query(
      `INSERT INTO member_events (event, source, created_at) VALUES ($1,$2,$3)`,
      [e.event, e.source, e.createdAt],
    );
  }

  private mapFeedback = (r: Record<string, unknown>): FeedbackRecord => ({
    id: String(r.id),
    userId: String(r.user_id),
    category: String(r.category) as FeedbackCategory,
    message: String(r.message),
    contextUrl: String(r.context_url ?? ""),
    status: String(r.status) as FeedbackStatus,
    createdAt: String(r.created_at),
  });

  async createFeedback(f: FeedbackRecord) {
    await this.pool.query(
      `INSERT INTO member_feedback (id, user_id, category, message, context_url, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [f.id, f.userId, f.category, f.message, f.contextUrl, f.status, f.createdAt],
    );
  }
  async listFeedback() {
    const { rows } = await this.pool.query(`SELECT * FROM member_feedback ORDER BY created_at DESC`);
    return rows.map(this.mapFeedback);
  }
  async updateFeedbackStatus(id: string, status: FeedbackStatus) {
    await this.pool.query(`UPDATE member_feedback SET status=$2 WHERE id=$1`, [id, status]);
  }
}

// ── Production accessor — lazy, fail-closed ─────────────────────────────────

let cachedStore: MemberStore | null | undefined;

export function memberStoreConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.DATABASE_URL);
}

/** Null when no database is configured — callers answer 503, honestly. */
export async function getMemberStore(): Promise<MemberStore | null> {
  if (cachedStore !== undefined) return cachedStore;
  if (!process.env.DATABASE_URL) {
    cachedStore = null;
    return null;
  }
  const { Pool, types } = await import("pg");
  // Timestamps must round-trip: pg's default Date parsing would later be
  // written back via String(date), which Postgres rejects. Normalize every
  // timestamptz/timestamp to an ISO string at the driver boundary instead.
  types.setTypeParser(types.builtins.TIMESTAMPTZ, (v: string) => new Date(v).toISOString());
  types.setTypeParser(types.builtins.TIMESTAMP, (v: string) => new Date(v + "Z").toISOString());
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  cachedStore = new PgMemberStore(pool as unknown as PgPool);
  return cachedStore;
}
