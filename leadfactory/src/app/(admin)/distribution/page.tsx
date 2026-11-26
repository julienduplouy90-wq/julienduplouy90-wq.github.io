import Link from "next/link";
import { Badge, Button, Card, CardHeader, EmptyState, Notice, PageHeader, Table, Td } from "@/components/ui";
import { setAssignmentStatus } from "@/lib/actions";
import { loadDistribution } from "@/lib/repo/queries";
import { formatMoney } from "@/lib/domain/money";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Distribution" };

export default async function Distribution() {
  const { queue, toSend, load } = await loadDistribution();
  return (
    <>
      <PageHeader title="Distribution" description="Prospects qualifiés à attribuer, transmissions à effectuer et charge des partenaires." />
      <Notice className="mb-6">Règle d&apos;exclusivité : un prospect n&apos;a qu&apos;une attribution active (garantie par la base de données). La transmission réelle est faite par vous, hors de l&apos;outil.</Notice>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title={`À attribuer (${queue.length})`} description="Prospects qualifiés manuellement, sans partenaire" />
          <Table head={["Prospect", "Projet", "Score", "Qualifié"]} empty={queue.length === 0 && <EmptyState title="Rien à attribuer" />}>
            {queue.map((l) => (
              <tr key={l.id}>
                <Td><Link href={`/prospects/${l.id}`} className="font-medium hover:underline">{l.fullName}</Link> <span className="text-xs text-muted-foreground">{l.postalCode}</span></Td>
                <Td className="text-xs">{l.projectName} {l.isDemo && <Badge tone="warning">Démo</Badge>}</Td>
                <Td className="tabular">{l.score}</Td>
                <Td className="text-xs text-muted-foreground">{formatDate(l.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card>
          <CardHeader title={`À transmettre (${toSend.length})`} description="Attributions validées, en attente d'envoi par vous" />
          <Table head={["Prospect", "Partenaire", "Prix", ""]} empty={toSend.length === 0 && <EmptyState title="Aucune transmission en attente" />}>
            {toSend.map((a) => (
              <tr key={a.id}>
                <Td><Link href={`/prospects/${a.leadId}`} className="font-medium hover:underline">{a.leadName}</Link></Td>
                <Td className="text-xs">{a.partnerName}</Td>
                <Td className="tabular">{a.isFree ? "Offert" : formatMoney(a.priceCents)}</Td>
                <Td>
                  <form action={setAssignmentStatus.bind(null, a.id)}><input type="hidden" name="status" value="sent" /><Button variant="secondary" className="h-8" type="submit">Marquer transmis</Button></form>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader title="Charge des partenaires actifs (mois en cours)" />
        <Table head={["Partenaire", "Attribués ce mois", "Capacité", "Disponibilité"]} empty={load.length === 0 && <EmptyState title="Aucun partenaire actif" />}>
          {load.map((p) => {
            const left = p.monthlyCapacity === null ? null : p.monthlyCapacity - p.thisMonth;
            return (
              <tr key={p.id}>
                <Td><Link href={`/partenaires/${p.id}`} className="hover:underline">{p.companyName}</Link> {p.isDemo && <Badge tone="warning">Démo</Badge>}</Td>
                <Td className="tabular">{p.thisMonth}</Td>
                <Td className="tabular">{p.monthlyCapacity ?? "Non définie"}</Td>
                <Td>{left === null ? <Badge>—</Badge> : left > 0 ? <Badge tone="success">{left} disponible(s)</Badge> : <Badge tone="danger">Complet</Badge>}</Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
