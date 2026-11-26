import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, Card, CardBody, CardHeader, Field, Input, Select } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { ProjectFields } from "@/components/admin/project-fields";
import { updateProject, updateSite } from "@/lib/actions";
import { getProject, listSites, loadDashboard } from "@/lib/repo/queries";
import { siteReadiness } from "@/lib/repo/site-readiness";
import { formatMoney } from "@/lib/domain/money";
import { SITE_STATUSES } from "@/lib/domain/labels";

const PUBLISHER_FIELDS: [string, string, string][] = [
  ["name", "Éditeur (nom ou société)", "Votre nom ou société"], ["legalForm", "Forme juridique", "Entrepreneur individuel…"],
  ["siret", "SIRET", "14 chiffres"], ["address", "Adresse", ""], ["email", "E-mail de contact", ""],
  ["director", "Directeur de la publication", ""], ["host", "Hébergeur (nom, adresse)", ""],
];

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProject(id);
  if (!data) notFound();
  const { project: p, services, partners } = data;
  const site = (await listSites()).find((s) => s.projectId === id);
  if (!site) notFound();
  const [r, { kpis: k }] = await Promise.all([siteReadiness(id, site.publisher, p.domain), loadDashboard({ period: "all", projectId: id })]);
  const base = `/s/${site.slug}`;
  const pages = [["Accueil", ""], ...services.map((s) => [s.name, `/services/${s.slug}`]), ["Formulaire de demande", "/devis"], ["FAQ", "/faq"],
    ["Contact", "/contact"], ["Mentions légales", "/mentions-legales"], ["Confidentialité", "/confidentialite"]];

  return (
    <>
      <Link href="/sites" className="text-sm text-muted-foreground hover:text-foreground">← Mes sites</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
            <Badge>{SITE_STATUSES[site.status]}</Badge>{p.isDemo && <Badge tone="warning">Démo</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{p.zoneLabel} · {k.leadsReceived} demande(s) · {k.leadsSold} vendue(s) · {formatMoney(k.revenuePaidCents)} encaissés</p>
        </div>
        <ButtonLink href={base} target="_blank" className="bg-emerald-600 text-white">Voir le site ↗</ButtonLink>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Réglages du site" description="Activité, zone, prix, référencement" />
            <CardBody><ActionForm action={updateProject.bind(null, id)} submitLabel="Enregistrer"><ProjectFields p={p} edit /></ActionForm></CardBody>
          </Card>
          <Card>
            <CardHeader title="Mentions légales" description="Obligatoires avant toute mise en ligne. Rien n'est inventé : les champs vides s'affichent « à compléter »." />
            <CardBody>
              <ActionForm action={updateSite.bind(null, site.id)} submitLabel="Enregistrer">
                <div className="grid gap-4 sm:grid-cols-2">
                  {PUBLISHER_FIELDS.map(([key, label, ph]) => <Field key={key} label={label}><Input name={key} defaultValue={site.publisher[key] ?? ""} placeholder={ph} /></Field>)}
                  <Field label="Statut" hint="La mise en ligne demandera votre accord.">
                    <Select name="status" defaultValue={site.status === "published" ? "preview" : site.status} options={[{ value: "draft", label: "Brouillon" }, { value: "preview", label: "Prévisualisation" }]} />
                  </Field>
                </div>
              </ActionForm>
            </CardBody>
          </Card>
        </div>
        <aside className="space-y-4">
          <Card>
            <CardHeader title={`Prêt à publier : ${r.done}/${r.checks.length}`} />
            <ul className="space-y-2 p-5 text-sm">
              {r.checks.map((c) => (
                <li key={c.label} className="flex gap-2"><span aria-hidden className={c.ok ? "text-success" : "text-warning"}>{c.ok ? "✓" : "○"}</span>{c.label}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title={`Pages (${pages.length})`} />
            <ul className="divide-y text-sm">
              {pages.map(([label, path]) => (
                <li key={path}><Link href={base + path} target="_blank" className="flex justify-between px-5 py-2 hover:bg-muted/50"><span className="truncate">{label}</span><span className="text-muted-foreground">↗</span></Link></li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Partenaires de ce site" />
            {partners.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Aucun. Associez-les depuis leur fiche, côté <Link href="/partenaires" className="text-indigo-600">Leads → Partenaires</Link>.</p> : (
              <ul className="divide-y text-sm">
                {partners.map((pa) => <li key={pa.id}><Link href={`/partenaires/${pa.id}`} className="block px-5 py-2 hover:bg-muted/50">{pa.companyName}</Link></li>)}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
