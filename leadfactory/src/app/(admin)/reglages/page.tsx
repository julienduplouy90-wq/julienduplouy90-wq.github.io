import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Table, Td } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/action-form";
import { purgeDemo, purgeExpiredLeads, updateWorkspace } from "@/lib/actions";
import { getWorkspace } from "@/lib/repo/queries";
import { getDbMode } from "@/lib/db/client";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Réglages" };

export default async function Settings() {
  const { workspace: w, counts: c, audit } = await getWorkspace();
  const demoTotal = c.demoProjects + c.demoLeads + c.demoPartners;
  return (
    <>
      <PageHeader title="Réglages" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Espace de travail" />
          <CardBody>
            <form action={updateWorkspace} className="space-y-4">
              <Field label="Nom"><Input name="name" defaultValue={w.name} /></Field>
              <Field label="Durée de conservation des prospects (jours)" hint="Au-delà, les données personnelles sont anonymisables (30 à 3650 jours). S'applique aux nouveaux prospects.">
                <Input name="leadRetentionDays" type="number" min={30} max={3650} defaultValue={w.leadRetentionDays} />
              </Field>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Données" />
          <CardBody className="space-y-5">
            <div>
              <p className="text-sm font-medium">Données de démonstration</p>
              <p className="text-sm text-muted-foreground">{demoTotal === 0 ? "Aucune donnée de démonstration." : `${c.demoProjects} projet(s), ${c.demoLeads} prospect(s), ${c.demoPartners} partenaire(s) fictifs.`}</p>
              {demoTotal > 0 && (
                <form action={purgeDemo} className="mt-2">
                  <ConfirmButton message="Supprimer définitivement toutes les données de démonstration ? Le projet pilote et vos données réelles sont conservés.">Supprimer la démo</ConfirmButton>
                </form>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Conservation</p>
              <p className="text-sm text-muted-foreground">{c.expired} prospect(s) ont dépassé leur durée de conservation.</p>
              {c.expired > 0 && (
                <form action={purgeExpiredLeads} className="mt-2">
                  <ConfirmButton message="Anonymiser les prospects arrivés en fin de conservation ?">Anonymiser les prospects expirés</ConfirmButton>
                </form>
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium">Environnement</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>Base de données : <Badge>{getDbMode()}</Badge></li>
                <li>Protection de l&apos;administration : <Badge tone={process.env.ADMIN_PASSWORD ? "success" : "warning"}>{process.env.ADMIN_PASSWORD ? "mot de passe actif" : "aucune (local uniquement)"}</Badge></li>
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>
      <details className="mt-6 rounded-xl border bg-card p-5">
        <summary className="cursor-pointer text-sm font-medium">Modules à venir (non disponibles)</summary>
        <ul className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          {["Recherche de niches et volumes de recherche", "Analyse de la concurrence SEO", "Contenus SEO assistés par IA (relus)", "Search Console et suivi des positions",
            "Google Ads", "Qualification assistée par IA", "Portail partenaire", "Facturation Stripe, crédits, abonnements", "Multi-utilisateur, marque blanche, domaines", "Internationalisation"].map((x) => <li key={x}>· {x}</li>)}
        </ul>
      </details>
      <Card className="mt-6">
        <CardHeader title="Journal des actions" description="30 dernières actions importantes" />
        <Table head={["Date", "Acteur", "Action", "Objet"]}>
          {audit.map((a) => (
            <tr key={a.id}>
              <Td className="text-xs whitespace-nowrap">{formatDate(a.createdAt, { dateStyle: "short", timeStyle: "medium" })}</Td>
              <Td className="text-xs">{a.actor}</Td>
              <Td className="font-mono text-xs">{a.action}</Td>
              <Td className="text-xs text-muted-foreground">{a.entity} {a.entityId?.slice(0, 8)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
