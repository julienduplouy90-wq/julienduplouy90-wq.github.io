import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, Card, CardBody, CardHeader, PageHeader, Stat } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { ProjectFields } from "@/components/admin/project-fields";
import { updateProject } from "@/lib/actions";
import { getProject, loadDashboard } from "@/lib/repo/queries";
import { formatMoney, formatPercent } from "@/lib/domain/money";
import { SITE_STATUSES } from "@/lib/domain/labels";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProject(id);
  if (!data) notFound();
  const { project: p, services, sites, partners } = data;
  const { kpis: k } = await loadDashboard({ period: "all", projectId: id });
  const eur = (c: number) => formatMoney(c, p.currency);
  return (
    <>
      <PageHeader title={p.name} description={<>{p.zoneLabel} · {p.isDemo && <Badge tone="warning">Démo</Badge>}</>}
        actions={sites[0] && <ButtonLink variant="secondary" href={`/s/${sites[0].slug}`} target="_blank">Prévisualiser le site</ButtonLink>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Prospects reçus" value={k.leadsReceived} />
        <Stat label="Vendus" value={k.leadsSold} hint={formatPercent(k.conversionRate)} />
        <Stat label="Revenus encaissés" value={eur(k.revenuePaidCents)} hint={`Prévisionnel ${eur(k.revenueForecastCents)}`} />
        <Stat label="Dépenses / marge" value={eur(k.expensesCents)} hint={`Marge ${eur(k.marginCents)}${p.budgetCents ? ` · budget ${eur(p.budgetCents)}` : ""}`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Paramètres du projet" description="Zone, prix, SEO et qualification — sans modifier le code." />
          <CardBody><ActionForm action={updateProject.bind(null, id)} submitLabel="Enregistrer"><ProjectFields p={p} edit /></ActionForm></CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Services" description="Issus du modèle de niche" />
            <ul className="divide-y text-sm">{services.map((s) => <li key={s.id} className="px-5 py-2.5">{s.name}</li>)}</ul>
          </Card>
          <Card>
            <CardHeader title="Site" />
            <CardBody className="space-y-1 text-sm">
              {sites.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <Link className="text-primary hover:underline" href={`/s/${s.slug}`} target="_blank">/s/{s.slug}</Link>
                  <Badge>{SITE_STATUSES[s.status]}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Partenaires associés" action={<Link href="/partenaires" className="text-xs text-primary">CRM →</Link>} />
            {partners.length === 0 ? <CardBody className="text-sm text-muted-foreground">Aucun partenaire associé. Associez-en depuis la fiche partenaire.</CardBody> : (
              <ul className="divide-y text-sm">
                {partners.map((pa) => (
                  <li key={pa.id} className="flex justify-between gap-2 px-5 py-2.5">
                    <Link href={`/partenaires/${pa.id}`} className="hover:underline">{pa.companyName}</Link>
                    <span className="tabular text-muted-foreground">{pa.agreedPriceCents !== null ? eur(pa.agreedPriceCents) : "prix à définir"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
