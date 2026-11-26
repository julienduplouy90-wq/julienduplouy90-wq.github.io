import Link from "next/link";
import { Badge, Button, ButtonLink, Card, EmptyState, Input, PageHeader, Select, Table, Td } from "@/components/ui";
import { listPartners } from "@/lib/repo/queries";
import { PARTNER_STATUSES, PARTNER_TONES } from "@/lib/domain/labels";
import { formatMoney } from "@/lib/domain/money";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Partenaires" };

export default async function Partners({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [partners, all] = await Promise.all([listPartners({ status: sp.status, q: sp.q }), listPartners({})]);
  const counts = Object.fromEntries(Object.keys(PARTNER_STATUSES).map((s) => [s, all.filter((p) => p.status === s).length]));
  return (
    <>
      <PageHeader title="Partenaires" description="CRM des entreprises partenaires. La prospection par e-mail reste gérée hors de l'outil (campagne Gmail existante)."
        actions={<><ButtonLink variant="secondary" href="/partenaires/import">Importer un CSV</ButtonLink><ButtonLink href="/partenaires/nouveau">Ajouter</ButtonLink></>} />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Link href="/partenaires" className={`rounded-full border px-3 py-1 text-xs whitespace-nowrap ${!sp.status ? "bg-primary text-primary-foreground" : "bg-card"}`}>Tous ({all.length})</Link>
        {Object.entries(PARTNER_STATUSES).map(([k, label]) => (
          <Link key={k} href={`/partenaires?status=${k}`} className={`rounded-full border px-3 py-1 text-xs whitespace-nowrap ${sp.status === k ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {label} ({counts[k]})
          </Link>
        ))}
      </div>
      <form method="get" className="mb-4 flex gap-2">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <Input name="q" defaultValue={sp.q} placeholder="Rechercher une entreprise ou une zone" className="w-72" />
        <Button variant="secondary" type="submit">Rechercher</Button>
      </form>
      <Card>
        <Table head={["Entreprise", "Statut", "Zone", "Prix accepté", "Capacité", "Attribués", "Vérifié le"]}
          empty={partners.length === 0 && <EmptyState title="Aucun partenaire">Importez votre liste existante via « Importer un CSV ».</EmptyState>}>
          {partners.map((p) => (
            <tr key={p.id}>
              <Td>
                <Link href={`/partenaires/${p.id}`} className="font-medium hover:underline">{p.companyName}</Link> {p.isDemo && <Badge tone="warning">Démo</Badge>}
                <div className="text-xs text-muted-foreground">{p.contactName ?? ""}</div>
              </Td>
              <Td><Badge tone={PARTNER_TONES[p.status]}>{PARTNER_STATUSES[p.status]}</Badge></Td>
              <Td className="text-xs">{p.zoneLabel ?? "—"} {p.zoneCodes.length > 0 && <span className="text-muted-foreground">({p.zoneCodes.join(", ")})</span>}</Td>
              <Td className="tabular">{p.acceptedPriceCents != null ? formatMoney(p.acceptedPriceCents) : "—"}</Td>
              <Td className="tabular">{p.monthlyCapacity ?? "—"}</Td>
              <Td className="tabular">{p.assignedCount}</Td>
              <Td className="text-xs text-muted-foreground">{formatDate(p.verifiedAt)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
