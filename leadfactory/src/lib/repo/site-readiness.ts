import { getDb, getWorkspaceId } from "@/lib/db";

/** Check-list avant publication d'un site (affichée côté Sites). */
export async function siteReadiness(projectId: string, publisher: Record<string, string>, domain: string | null) {
  const db = await getDb();
  const [{ active }] = (await db.query<{ active: number }>(
    `select count(*)::int active from partner_projects pp join partners p on p.id = pp.partner_id
      where pp.project_id = $1 and pp.active and p.status = 'active' and p.workspace_id = $2`, [projectId, await getWorkspaceId()])) as [{ active: number }];
  const checks = [
    { ok: !!publisher.name && !!publisher.address && !!publisher.email, label: "Mentions légales : éditeur, adresse, e-mail" },
    { ok: !!publisher.host, label: "Hébergeur renseigné" },
    { ok: !!domain, label: "Nom de domaine choisi" },
    { ok: active > 0, label: "Au moins un partenaire actif pour ce site" },
  ];
  return { checks, done: checks.filter((c) => c.ok).length, activePartners: active };
}
