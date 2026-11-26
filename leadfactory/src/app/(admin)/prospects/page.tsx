import Link from "next/link";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { listLeads, listProjects } from "@/lib/repo/queries";
import { LEAD_STATUSES, LEAD_TONES } from "@/lib/domain/labels";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Prospects" };

function scoreTone(s: number | null) {
  return s === null ? "neutral" : s >= 70 ? "success" : s >= 40 ? "warning" : "danger";
}

export default async function Leads({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [leads, projects] = await Promise.all([listLeads({ status: sp.status, projectId: sp.project, q: sp.q }), listProjects()]);
  return (
    <>
      <PageHeader title="Prospects" description="Demandes reçues via les formulaires. Toute qualification et toute transmission sont validées manuellement." />
      <form method="get" className="mb-4 flex flex-wrap gap-2" aria-label="Filtres">
        <Input name="q" defaultValue={sp.q} placeholder="Nom, code postal, commune…" className="w-56" />
        <Select name="status" defaultValue={sp.status ?? ""} className="w-48" options={[{ value: "", label: "Tous les statuts" }, ...Object.entries(LEAD_STATUSES).map(([value, label]) => ({ value, label }))]} />
        <Select name="project" defaultValue={sp.project ?? ""} className="w-60" options={[{ value: "", label: "Tous les projets" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
        <Button variant="secondary" type="submit">Filtrer</Button>
      </form>
      <Card>
        <Table head={["Prospect", "Projet", "Score", "Statut", "Partenaire", "Reçu le"]}
          empty={leads.length === 0 && <EmptyState title="Aucun prospect">Les demandes déposées sur les sites apparaissent ici.</EmptyState>}>
          {leads.map((l) => (
            <tr key={l.id}>
              <Td>
                <Link href={`/prospects/${l.id}`} className="font-medium whitespace-nowrap hover:underline">{l.fullName}</Link>
                <div className="text-xs text-muted-foreground">{l.postalCode} {l.city}</div>
              </Td>
              <Td className="text-xs">{l.projectName} {l.isDemo && <Badge tone="warning">Démo</Badge>}</Td>
              <Td><Badge tone={scoreTone(l.score)} className="tabular">{l.score ?? "—"}</Badge>{l.duplicateOf && <Badge tone="danger" className="ml-1">Doublon</Badge>}</Td>
              <Td><Badge tone={LEAD_TONES[l.status]}>{LEAD_STATUSES[l.status]}</Badge></Td>
              <Td className="text-xs">{l.partnerName ?? "—"}</Td>
              <Td className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(l.createdAt, { dateStyle: "short", timeStyle: "short" })}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
