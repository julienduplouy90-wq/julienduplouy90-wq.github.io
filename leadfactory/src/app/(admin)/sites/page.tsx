import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { listSites } from "@/lib/repo/queries";
import { siteReadiness } from "@/lib/repo/site-readiness";
import { SITE_STATUSES } from "@/lib/domain/labels";

export const metadata = { title: "Mes sites" };

export default async function Sites() {
  const sites = await listSites();
  const ready = await Promise.all(sites.map((s) => siteReadiness(s.projectId, s.publisher, s.domain)));
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mes sites</h1>
          <p className="mt-1 text-sm text-muted-foreground">Un site = une activité dans une zone. Prévisualisation uniquement : rien n&apos;est en ligne.</p>
        </div>
        <ButtonLink href="/sites/nouveau" className="bg-emerald-600 text-white">Nouveau site</ButtonLink>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sites.map((s, i) => {
          const r = ready[i]!;
          return (
            <Card key={s.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/sites/${s.projectId}`} className="text-lg font-semibold hover:underline">{s.projectName}</Link>
                  <p className="text-sm text-muted-foreground">{s.zoneLabel}</p>
                </div>
                <div className="flex shrink-0 gap-1">{s.isDemo && <Badge tone="warning">Démo</Badge>}<Badge>{SITE_STATUSES[s.status]}</Badge></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-2xl font-semibold tabular">{s.leads}</div><div className="text-xs text-muted-foreground">demandes reçues</div></div>
                <div>
                  <div className="text-2xl font-semibold tabular">{r.done}/{r.checks.length}</div>
                  <div className="text-xs text-muted-foreground">prêt pour la mise en ligne</div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${(r.done / r.checks.length) * 100}%` }} /></div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                <ButtonLink href={`/sites/${s.projectId}`} className="bg-emerald-600 text-white">Gérer le site</ButtonLink>
                <ButtonLink href={`/s/${s.slug}`} target="_blank" variant="secondary">Voir le site ↗</ButtonLink>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
