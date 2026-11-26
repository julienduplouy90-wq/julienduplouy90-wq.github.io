import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, Stat, Table, Td } from "@/components/ui";
import { BarChart, HBars } from "@/components/admin/charts";
import { FilterBar } from "@/components/admin/filters";
import { loadDashboard } from "@/lib/repo/queries";
import { formatMoney, formatPercent } from "@/lib/domain/money";
import { EXPENSE_CATEGORIES, LEAD_STATUSES, LEAD_TONES } from "@/lib/domain/labels";
import { formatDate, parsePeriod, PERIODS } from "@/lib/utils";

export const metadata = { title: "Vue d'ensemble" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const d = await loadDashboard({ period, projectId: sp.project || undefined, niche: sp.niche || undefined });
  const k = d.kpis;
  const eur = (c: number) => formatMoney(c);
  return (
    <>
      <PageHeader title="Vue d'ensemble" description={`Indicateurs sur ${PERIODS[period].toLowerCase()} — prospects, partenaires et rentabilité.`} />
      <FilterBar period={period} projectId={sp.project} niche={sp.niche} projects={d.projects} />

      <section aria-label="Activité" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Projets" value={d.projectCount} />
        <Stat label="Sites publiés" value={d.counts.sitesLive} hint={`${d.counts.sitesTotal} au total`} />
        <Stat label="Partenaires actifs" value={d.counts.partnersActive} hint={`${d.counts.partnersTotal} dans le CRM`} />
        <Stat label="Prospects reçus" value={k.leadsReceived} />
        <Stat label="Prospects qualifiés" value={k.leadsQualified} />
        <Stat label="Prospects transmis" value={k.leadsSent} hint={`${k.leadsFree} offert(s), ${k.leadsRefused} refusé(s)`} />
      </section>

      <section aria-label="Rentabilité" className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Prospects vendus" value={k.leadsSold} />
        <Stat label="Chiffre d'affaires encaissé" value={eur(k.revenuePaidCents)} hint={`Facturé ${eur(k.revenueInvoicedCents)} · prév. ${eur(k.revenueForecastCents)}`} />
        <Stat label="Dépenses" value={eur(k.expensesCents)} />
        <Stat label="Marge (encaissé − dépenses)" value={eur(k.marginCents)} tone={k.marginCents >= 0 ? "success" : "danger"} hint={`Prévisionnelle : ${eur(k.marginForecastCents)}`} />
        <Stat label="Taux de conversion" value={formatPercent(k.conversionRate)} hint="Vendus / reçus" />
        <Stat label="Coût par prospect" value={k.costPerLeadCents === null ? "—" : eur(k.costPerLeadCents)} hint="Dépenses / reçus" />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Prospects par semaine" description="12 dernières semaines (filtre projet / niche appliqué)" />
          <CardBody><BarChart ariaLabel="Prospects reçus et vendus par semaine" data={d.weeks.map((w) => ({ label: w.label, a: w.received, b: w.sold }))} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Dépenses par catégorie" />
          <CardBody>
            {Object.keys(k.expensesByCategory).length === 0 ? <p className="text-sm text-muted-foreground">Aucune dépense sur la période.</p> : (
              <HBars format={eur} rows={Object.entries(k.expensesByCategory).map(([c, v]) => ({ label: EXPENSE_CATEGORIES[c] ?? c, value: v }))} />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Rentabilité par projet" action={<Link href="/finances" className="text-xs text-primary">Finances →</Link>} />
          <Table head={["Projet", "Reçus", "Vendus", "Encaissé", "Marge"]}>
            {d.byProject.map(({ project: p, kpis }) => (
              <tr key={p.id}>
                <Td><Link href={`/projets/${p.id}`} className="font-medium hover:underline">{p.name}</Link> {p.isDemo && <Badge tone="warning">Démo</Badge>}</Td>
                <Td className="tabular">{kpis.leadsReceived}</Td>
                <Td className="tabular">{kpis.leadsSold}</Td>
                <Td className="tabular">{eur(kpis.revenuePaidCents)}</Td>
                <Td className={kpis.marginCents < 0 ? "tabular text-danger" : "tabular"}>{eur(kpis.marginCents)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card>
          <CardHeader title="Derniers prospects" action={<Link href="/prospects" className="text-xs text-primary">Tous →</Link>} />
          {d.recent.length === 0 ? <EmptyState title="Aucun prospect pour l'instant">Les demandes du formulaire apparaîtront ici.</EmptyState> : (
            <Table head={["Prospect", "Score", "Statut", "Reçu"]}>
              {d.recent.map((l) => (
                <tr key={l.id}>
                  <Td>
                    <Link href={`/prospects/${l.id}`} className="font-medium whitespace-nowrap hover:underline">{l.fullName}</Link>
                    <div className="text-xs text-muted-foreground">{l.postalCode} · {l.projectName}</div>
                  </Td>
                  <Td className="tabular">{l.score ?? "—"}</Td>
                  <Td><Badge tone={LEAD_TONES[l.status]}>{LEAD_STATUSES[l.status]}</Badge></Td>
                  <Td className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(l.createdAt)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
