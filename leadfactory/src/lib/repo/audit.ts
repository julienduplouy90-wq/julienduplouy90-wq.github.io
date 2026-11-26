import type { Db } from "@/lib/db/client";

/** Journalise une action importante. Ne jamais y stocker de données personnelles en clair. */
export async function audit(db: Db, workspaceId: string | null, actor: string, action: string, entity: string, entityId: string | null, data?: unknown) {
  await db.query(
    "insert into audit_log (workspace_id, actor, action, entity, entity_id, data) values ($1,$2,$3,$4,$5,$6::jsonb)",
    [workspaceId, actor, action, entity, entityId, data === undefined ? null : JSON.stringify(data)],
  );
}
