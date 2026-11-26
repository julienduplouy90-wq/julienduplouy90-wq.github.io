import Link from "next/link";
import { Badge, ButtonLink, Card, PageHeader, Table, Td } from "@/components/ui";
import { listProjects } from "@/lib/repo/queries";
import { PROJECT_STATUSES } from "@/lib/domain/labels";
import { formatMoney } from "@/lib/domain/money";
import { NICHES } from "@/lib/sites/niches";

export const metadata = { title: "Projets" };

export default async function Projects() {
  const projects = await listProjects();
  return (
    <>
      <PageHeader title="Projets" description="Une niche × une zone géographique = un projet, avec son site et ses partenaires."
        actions={<ButtonLink href="/projets/nouveau">Nouveau projet</ButtonLink>} />
      <Card>
        <Table head={["Projet", "Niche", "Zone", "Statut", "Prix cible", "Budget"]}>
          {projects.map((p) => (
            <tr key={p.id}>
              <Td><Link href={`/projets/${p.id}`} className="font-medium hover:underline">{p.name}</Link> {p.isDemo && <Badge tone="warning">Démo</Badge>}</Td>
              <Td>{NICHES[p.niche]?.name ?? p.niche}</Td>
              <Td>{p.zoneLabel}</Td>
              <Td><Badge tone={p.status === "active" ? "success" : "neutral"}>{PROJECT_STATUSES[p.status]}</Badge></Td>
              <Td className="tabular">{formatMoney(p.targetPriceCents, p.currency)}</Td>
              <Td className="tabular">{p.budgetCents ? formatMoney(p.budgetCents, p.currency) : "—"}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
