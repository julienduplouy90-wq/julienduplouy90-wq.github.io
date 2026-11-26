import { Badge, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Stat, Table, Td } from "@/components/ui";
import { ActionForm, ConfirmButton } from "@/components/admin/action-form";
import { FilterBar } from "@/components/admin/filters";
import { createExpense, deleteExpense } from "@/lib/actions";
import { loadFinances } from "@/lib/repo/queries";
import { EXPENSE_CATEGORIES } from "@/lib/domain/labels";
import { formatMoney, formatPercent } from "@/lib/domain/money";
import { formatDate, parsePeriod } from "@/lib/utils";

export const metadata = { title: "Finances" };

export default async function Finances({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const f = await loadFinances({ period, projectId: sp.project || undefined, niche: sp.niche || undefined });
  const k = f.kpis;
  const eur = (c: number) => formatMoney(c);
  return (
    <>
      <PageHeader title="Finances" description="Revenus prévisionnels, facturés et encaissés ; dépenses ; marge par projet." />
      <FilterBar period={period} projectId={sp.project} niche={sp.niche} projects={f.projects} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Prévisionnel" value={eur(k.revenueForecastCents)} hint="Attributions facturables actives" />
        <Stat label="Facturé" value={eur(k.revenueInvoicedCents)} />
        <Stat label="Encaissé" value={eur(k.revenuePaidCents)} />
        <Stat label="Dépenses" value={eur(k.expensesCents)} />
        <Stat label="Marge réelle" value={eur(k.marginCents)} tone={k.marginCents >= 0 ? "success" : "danger"} />
        <Stat label="Prospects offerts / refusés" value={`${k.leadsFree} / ${k.leadsRefused}`} hint={`${k.leadsSold} facturables`} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Marge par projet" />
        <Table head={["Projet", "Reçus", "Vendus", "Conv.", "Prévisionnel", "Facturé", "Encaissé", "Dépenses", "Marge", "Coût / prospect"]}>
          {f.byProject.map(({ project: p, kpis: x }) => (
            <tr key={p.id}>
              <Td className="font-medium">{p.name} {p.isDemo && <Badge tone="warning">Démo</Badge>}</Td>
              <Td className="tabular">{x.leadsReceived}</Td>
              <Td className="tabular">{x.leadsSold}</Td>
              <Td className="tabular">{formatPercent(x.conversionRate)}</Td>
              <Td className="tabular">{eur(x.revenueForecastCents)}</Td>
              <Td className="tabular">{eur(x.revenueInvoicedCents)}</Td>
              <Td className="tabular">{eur(x.revenuePaidCents)}</Td>
              <Td className="tabular">{eur(x.expensesCents)}</Td>
              <Td className={`tabular ${x.marginCents < 0 ? "text-danger" : ""}`}>{eur(x.marginCents)}</Td>
              <Td className="tabular">{x.costPerLeadCents === null ? "—" : eur(x.costPerLeadCents)}</Td>
            </tr>
          ))}
        </Table>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Ajouter une dépense" />
          <CardBody>
            <ActionForm action={createExpense} submitLabel="Ajouter">
              <div className="space-y-3">
                <Field label="Libellé"><Input name="label" required placeholder="Nom de domaine" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Montant (€)"><Input name="amount" required inputMode="decimal" placeholder="12,00" /></Field>
                  <Field label="Date"><Input name="spentOn" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
                </div>
                <Field label="Catégorie"><Select name="category" options={Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => ({ value, label }))} /></Field>
                <Field label="Projet"><Select name="projectId" options={[{ value: "", label: "Frais généraux (aucun projet)" }, ...f.projects.map((p) => ({ value: p.id, label: p.name }))]} /></Field>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Dépenses" />
          <Table head={["Date", "Libellé", "Catégorie", "Projet", "Montant", ""]}>
            {f.expenseList.map((e) => (
              <tr key={e.id}>
                <Td className="text-xs whitespace-nowrap">{formatDate(e.spentOn)}</Td>
                <Td>{e.label} {e.isDemo && <Badge tone="warning">Démo</Badge>}</Td>
                <Td className="text-xs">{EXPENSE_CATEGORIES[e.category]}</Td>
                <Td className="text-xs">{e.projectName ?? "Frais généraux"}</Td>
                <Td className="tabular">{eur(e.amountCents)}</Td>
                <Td><form action={deleteExpense.bind(null, e.id)}><ConfirmButton variant="secondary" message="Supprimer cette dépense ?">Supprimer</ConfirmButton></form></Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
