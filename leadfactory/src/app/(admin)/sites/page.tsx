import Link from "next/link";
import { Badge, Card, CardBody, CardHeader, Field, Input, Notice, PageHeader, Select } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { updateSite } from "@/lib/actions";
import { listSites } from "@/lib/repo/queries";
import { SITE_STATUSES } from "@/lib/domain/labels";
import { getNiche } from "@/lib/sites/niches";
import { getDb, getWorkspaceId } from "@/lib/db";

export const metadata = { title: "Sites" };

const PUBLISHER_FIELDS: [string, string, string][] = [
  ["name", "Éditeur (nom ou raison sociale)", "Votre nom ou société"],
  ["legalForm", "Forme juridique", "Entrepreneur individuel, SASU…"],
  ["siret", "SIRET", "14 chiffres"],
  ["address", "Adresse de l'éditeur", ""],
  ["email", "E-mail de contact", ""],
  ["director", "Directeur de la publication", ""],
  ["host", "Hébergeur (nom, adresse)", "Ex. : Vercel Inc., …"],
];

export default async function Sites() {
  const sites = await listSites();
  const db = await getDb();
  const ws = await getWorkspaceId();
  return (
    <>
      <PageHeader title="Sites" description="Générés depuis les données du projet et le modèle de niche. Prévisualisation locale uniquement : aucune mise en ligne." />
      <Notice tone="info" className="mb-6">
        La publication sur un domaine réel nécessitera votre autorisation explicite (déploiement Vercel + DNS). Elle n&apos;est pas réalisable depuis le MVP.
      </Notice>
      <div className="space-y-6">
        {await Promise.all(sites.map(async (s) => {
          const niche = getNiche(s.niche);
          const [{ active }] = (await db.query<{ active: number }>(
            `select count(*)::int active from partner_projects pp join partners p on p.id = pp.partner_id
              where pp.project_id = $1 and pp.active and p.status = 'active' and p.workspace_id = $2`, [s.projectId, ws])) as [{ active: number }];
          const checks = [
            { ok: !!s.publisher.name && !!s.publisher.address && !!s.publisher.email, label: "Mentions légales : éditeur, adresse et contact renseignés" },
            { ok: !!s.publisher.host, label: "Hébergeur renseigné" },
            { ok: !!s.domain, label: "Domaine associé" },
            { ok: active > 0, label: "Au moins un partenaire actif lié au projet (sinon les demandes ne pourront pas être servies)" },
            { ok: true, label: "Pages géographiques : aucune page pauvre générée (zone unique décrite sur l'accueil)" },
          ];
          const pages = ["Accueil", ...niche.services.map((x) => `Service : ${x.name}`), "Demande de devis", "FAQ", "Contact", "Mentions légales", "Confidentialité", "sitemap.xml", "robots.txt"];
          return (
            <Card key={s.id}>
              <CardHeader
                title={<span className="flex flex-wrap items-center gap-2">{s.projectName} {s.isDemo && <Badge tone="warning">Démo</Badge>} <Badge>{SITE_STATUSES[s.status]}</Badge></span>}
                description={`${s.zoneLabel} · modèle ${s.template} · ${s.leads} demande(s) reçue(s)`}
                action={<Link href={`/s/${s.slug}`} target="_blank" className="text-sm text-primary hover:underline whitespace-nowrap">Prévisualiser ↗</Link>}
              />
              <CardBody className="grid gap-6 lg:grid-cols-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">Avant publication</h3>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {checks.map((c) => (
                      <li key={c.label} className="flex gap-2"><span aria-hidden className={c.ok ? "text-success" : "text-warning"}>{c.ok ? "✓" : "!"}</span><span>{c.label}</span></li>
                    ))}
                  </ul>
                  <h3 className="mt-5 text-xs font-semibold uppercase text-muted-foreground">Pages générées ({pages.length})</h3>
                  <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">{pages.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
                <div className="lg:col-span-2">
                  <ActionForm action={updateSite.bind(null, s.id)} submitLabel="Enregistrer le site">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Statut" hint="« Publié » n'est pas disponible dans le MVP.">
                        <Select name="status" defaultValue={s.status === "published" ? "preview" : s.status} options={[{ value: "draft", label: "Brouillon" }, { value: "preview", label: "Prévisualisation" }]} />
                      </Field>
                      <div />
                      {PUBLISHER_FIELDS.map(([k, label, ph]) => (
                        <Field key={k} label={label}><Input name={k} defaultValue={s.publisher[k] ?? ""} placeholder={ph} /></Field>
                      ))}
                    </div>
                  </ActionForm>
                </div>
              </CardBody>
            </Card>
          );
        }))}
      </div>
    </>
  );
}
