import { createDb, migrate, type Db } from "./client";
import { seedBase, seedDemo } from "./seed";

const g = globalThis as unknown as { __leadfactoryDb?: Promise<Db> };

async function boot(): Promise<Db> {
  const db = await createDb();
  await migrate(db);
  const [{ n }] = (await db.query<{ n: number }>("select count(*)::int as n from workspaces")) as [{ n: number }];
  if (n === 0) {
    const ws = await seedBase(db);
    if (process.env.SEED_DEMO !== "false") await seedDemo(db, ws);
  }
  return db;
}

/** Connexion unique par processus (PGlite n'accepte qu'un seul client sur un répertoire). */
export function getDb(): Promise<Db> {
  if (!g.__leadfactoryDb) {
    g.__leadfactoryDb = boot().catch((e) => {
      g.__leadfactoryDb = undefined;
      throw e;
    });
  }
  return g.__leadfactoryDb;
}

/**
 * Mode local mono-utilisateur : premier espace de travail.
 * Futur : déduit de la session Supabase Auth (workspace_members).
 */
export async function getWorkspaceId(): Promise<string> {
  const db = await getDb();
  const rows = await db.query<{ id: string }>("select id from workspaces order by created_at limit 1");
  if (!rows[0]) throw new Error("Aucun espace de travail");
  return rows[0].id;
}

export type { Db };
