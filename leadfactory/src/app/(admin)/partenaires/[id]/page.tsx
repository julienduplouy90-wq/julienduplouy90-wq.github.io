import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, Input, PageHeader, Select, Table, Td, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { PartnerFields } from "@/components/admin/partner-fields";
import { addInteraction, linkPartnerToProject, savePartner } from "@/lib/actions";
import { getPartner, listProjects } from "@/lib/repo/queries";
import { ASSIGNMENT_STATUSES, BILLING_STATUSES, PARTNER_STATUSES, PARTNER_TONES } from "@/lib/domain/labels";
import { formatMoney } from "@/lib/domain/money";
import { assainissement } from "@/lib/sites/niches/assainissement";
import { formatDate } from "@/lib/utils";

const CHANNELS = [{ value: "email", label: "E-mail" }, { value: "phone", label: "Téléphone" }, { value: "meeting", label: "Rendez-vous" }, { value: "other", label: "Autre" }];

export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPartner(id);
  if (!data) notFound();
  const { partner: p, interactions, projects, assignments } = data;
  const allProjects = await listProjects();
  return (
    <>
      <PageHeader title={p.companyName}
        description={<span className="flex flex-wrap items-center gap-2"><Badge tone={PARTNER_TONES[p.status]}>{PARTNER_STATUSES[p.status]}</Badge>{p.isDemo && <Badge tone="warning">Démo — fictif</Badge>}</span>}
        actions={<Link href="/partenaires" className="text-sm text-primary">← Partenaires</Link>} />
      {p.status === "opted_out" && (
        <div className="mb-6 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">Opposition à la prospection : ne plus contacter cette entreprise à des fins commerciales.</div>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Fiche" />
          <CardBody>
            <ActionForm action={savePartner.bind(null, id)} submitLabel="Enregistrer"><PartnerFields p={p} services={assainissement.services} /></ActionForm>
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Historique des échanges" />
            <CardBody className="space-y-4">
              <form action={addInteraction.bind(null, id)} className="space-y-2">
                <div className="flex gap-2"><Select name="channel" options={CHANNELS} className="w-36" /><Input type="datetime-local" name="occurredAt" /></div>
                <Textarea name="summary" required placeholder="Résumé de l'échange" />
                <Button variant="secondary" type="submit">Ajouter</Button>
              </form>
              <ol className="space-y-3 border-l pl-4">
                {interactions.map((i) => (
                  <li key={i.id} className="text-sm">
                    <div className="text-xs text-muted-foreground">{formatDate(i.occurredAt, { dateStyle: "medium", timeStyle: "short" })} · {CHANNELS.find((c) => c.value === i.channel)?.label}</div>
                    <p className="whitespace-pre-line">{i.summary}</p>
                  </li>
                ))}
                {interactions.length === 0 && <li className="text-sm text-muted-foreground">Aucun échange enregistré.</li>}
              </ol>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Projets associés" description="Prix convenu et prospects offerts par projet" />
            <CardBody className="space-y-3">
              {projects.map((pr) => (
                <div key={pr.projectId} className="flex justify-between text-sm">
                  <Link href={`/projets/${pr.projectId}`} className="hover:underline">{pr.name}</Link>
                  <span className="text-muted-foreground">{pr.agreedPriceCents != null ? formatMoney(pr.agreedPriceCents) : "prix à définir"} · {pr.freeLeadsGranted} offert(s)</span>
                </div>
              ))}
              <form action={linkPartnerToProject.bind(null, id)} className="flex flex-wrap gap-2 border-t pt-3">
                <Select name="projectId" className="w-full" options={allProjects.map((x) => ({ value: x.id, label: x.name }))} />
                <Input name="agreedPrice" inputMode="decimal" placeholder="Prix convenu (€)" className="w-40" />
                <Button variant="secondary" type="submit">Associer</Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
      <Card className="mt-6">
        <CardHeader title="Prospects attribués" />
        <Table head={["Prospect", "Statut", "Prix", "Facturation", "Date"]}>
          {assignments.map((a) => (
            <tr key={a.id}>
              <Td><Link href={`/prospects/${a.leadId}`} className="hover:underline">{a.leadName}</Link></Td>
              <Td><Badge>{ASSIGNMENT_STATUSES[a.status]}</Badge></Td>
              <Td className="tabular">{a.isFree ? "Offert" : formatMoney(a.priceCents)}</Td>
              <Td>{BILLING_STATUSES[a.billingStatus]}</Td>
              <Td className="text-xs text-muted-foreground">{formatDate(a.validatedAt)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
