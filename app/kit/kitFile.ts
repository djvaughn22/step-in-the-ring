// ─────────────────────────────────────────────────────────────────────────────
// Where the kit PDF lives — server-side only.
//
// The paid file is never in Git and never in /public. Production keeps it in
// the site's own Postgres (table sitr_kit_files, migrations/005), put there by
// the owner with scripts/upload-kit-file.mjs. The newest row is what buyers
// download, so an update reaches every buyer the moment it is uploaded.
//
// KIT_FILE_PATH points at a file on disk instead. It is for local testing
// only; a deployment built from Git has no such file.
// ─────────────────────────────────────────────────────────────────────────────

import { KIT_ID } from "./kit";

export interface KitFileInfo {
  version: string;
  filename: string;
  contentType: string;
  byteLength: number;
  uploadedAt: string;
}

export interface KitFile extends KitFileInfo {
  bytes: Uint8Array;
}

export interface KitFileSource {
  info(): Promise<KitFileInfo | null>;
  load(): Promise<KitFile | null>;
}

type Row = Record<string, unknown>;
type PgPool = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Row[] }> };

function isoTime(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function pgKitFileSource(pool: PgPool, product: string = KIT_ID): KitFileSource {
  const newest = async (withBytes: boolean): Promise<Row | null> => {
    try {
      const { rows } = await pool.query(
        `SELECT version, filename, content_type, octet_length(bytes) AS byte_length, uploaded_at${withBytes ? ", bytes" : ""}
           FROM sitr_kit_files WHERE product = $1
           ORDER BY uploaded_at DESC, id DESC LIMIT 1`,
        [product],
      );
      return rows[0] ?? null;
    } catch (err) {
      // No table yet means nothing was uploaded. Anything else is a real fault.
      if ((err as { code?: string })?.code === "42P01") return null;
      throw err;
    }
  };
  const toInfo = (row: Row): KitFileInfo => ({
    version: String(row.version),
    filename: String(row.filename),
    contentType: String(row.content_type),
    byteLength: Number(row.byte_length),
    uploadedAt: isoTime(row.uploaded_at),
  });
  return {
    async info() {
      const row = await newest(false);
      return row ? toInfo(row) : null;
    },
    async load() {
      const row = await newest(true);
      if (!row || !(row.bytes instanceof Uint8Array)) return null;
      return { ...toInfo(row), bytes: row.bytes };
    },
  };
}

export function diskKitFileSource(filePath: string, version: string): KitFileSource {
  const read = async () => {
    const { readFile, stat } = await import("node:fs/promises");
    const path = await import("node:path");
    try {
      const [bytes, st] = await Promise.all([readFile(filePath), stat(filePath)]);
      return { bytes, info: { version, filename: path.basename(filePath), contentType: "application/pdf", byteLength: st.size, uploadedAt: st.mtime.toISOString() } };
    } catch {
      return null;
    }
  };
  return {
    async info() {
      return (await read())?.info ?? null;
    },
    async load() {
      const r = await read();
      return r ? { ...r.info, bytes: r.bytes } : null;
    },
  };
}

let cachedPool: PgPool | null = null;

export async function getKitFileSource(env: Record<string, string | undefined> = process.env): Promise<KitFileSource | null> {
  if (env.KIT_FILE_PATH) return diskKitFileSource(env.KIT_FILE_PATH, env.KIT_FILE_VERSION || "local");
  if (!env.DATABASE_URL) return null;
  if (!cachedPool) {
    const { Pool } = await import("pg");
    cachedPool = new Pool({ connectionString: env.DATABASE_URL, max: 2 }) as unknown as PgPool;
  }
  return pgKitFileSource(cachedPool);
}

/** Checkout calls this first: no file, no sale. */
export async function kitFileReady(): Promise<boolean> {
  try {
    const source = await getKitFileSource();
    return Boolean(source && (await source.info()));
  } catch {
    return false;
  }
}
