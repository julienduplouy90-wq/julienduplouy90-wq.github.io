import { readdir, readFile, mkdir } from "node:fs/promises";
import path from "node:path";

/** Interface minimale commune à PGlite (local) et postgres.js (Supabase / Postgres). */
export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  exec(text: string): Promise<void>;
  tx<R>(fn: (db: Db) => Promise<R>): Promise<R>;
  close(): Promise<void>;
}

export type DbMode = "local" | "memory" | "postgres";

export function getDbMode(): DbMode {
  const m = process.env.DATABASE_MODE ?? "local";
  if (m === "local" || m === "memory" || m === "postgres") return m;
  throw new Error(`DATABASE_MODE invalide : ${m}`);
}

async function createPglite(dataDir?: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  if (dataDir) await mkdir(dataDir, { recursive: true });
  const pg = new PGlite(dataDir);
  await pg.waitReady;
  type Q = Pick<typeof pg, "query" | "exec">;
  const wrap = (q: Q, inTx: boolean): Db => {
    const self: Db = {
      async query<T>(text: string, params: unknown[] = []) {
        return (await q.query<T>(text, params as never[])).rows;
      },
      async exec(text: string) {
        await q.exec(text);
      },
      // Transactions imbriquées : on réutilise la transaction courante.
      tx: (fn) => (inTx ? fn(self) : pg.transaction((t) => fn(wrap(t as unknown as Q, true)))),
      close: () => (inTx ? Promise.resolve() : pg.close()),
    };
    return self;
  };
  return wrap(pg, false);
}

async function createPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 5, prepare: false });
  type Q = { unsafe: (q: string, p?: never[]) => Promise<unknown> };
  const wrap = (s: Q, inTx: boolean): Db => {
    const self: Db = {
      async query<T>(text: string, params: unknown[] = []) {
        return (await s.unsafe(text, params as never[])) as T[];
      },
      async exec(text: string) {
        await s.unsafe(text);
      },
      tx: <R,>(fn: (db: Db) => Promise<R>) =>
        inTx ? fn(self) : (sql.begin((t) => fn(wrap(t as unknown as Q, true))) as Promise<R>),
      close: () => (inTx ? Promise.resolve() : sql.end()),
    };
    return self;
  };
  return wrap(sql as unknown as Q, false);
}

export async function createDb(mode: DbMode = getDbMode()): Promise<Db> {
  if (mode === "postgres") {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquant (DATABASE_MODE=postgres)");
    return createPostgres(url);
  }
  if (mode === "memory") return createPglite();
  return createPglite(path.join(process.cwd(), ".data", "pglite"));
}

/** Applique les migrations SQL de db/migrations dans l'ordre, une seule fois chacune. */
export async function migrate(db: Db, dir = path.join(process.cwd(), "db", "migrations")) {
  await db.exec(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const done = new Set((await db.query<{ name: string }>("select name from schema_migrations")).map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    const sqlText = await readFile(path.join(dir, f), "utf8");
    await db.tx(async (t) => {
      await t.exec(sqlText);
      await t.query("insert into schema_migrations (name) values ($1)", [f]);
    });
  }
}
