import Link from "next/link";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui";
import { Chips } from "@/components/admin/chips";
import { billingQueue, leadStepCounts, loadDashboard } from "@/lib/repo/queries";
import { formatMoney } from "@/lib/domain/money";
import { LEAD_STATUSES, LEAD_TONES } from "@/lib/domain/labels";
import { cn, formatDate, parsePeriod } from "@/lib/utils";

export const metadata = { title: "Leads" };

const PERIODS = [["30d", "30 jours"], ["90d", "90 jours"], ["12m", "12 mois"], ["all", "Tout"]] as const;

export default async function LeadsHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period ?? "30d");
  const project = sp.project || undefined;
  const [d, steps, billing] = await Promise.all([loadDashboard({ period, projectId: project }), leadStepCounts(), billingQueue()]);
  const k = d.kpis;
  const eur = (c: number) => formatMoney(c);
  const q = (o: Record<string, string | undefined>) => "?" + new URLSearchParams(Object.entries({ period, project, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  const todo = [
    { n: steps["a-verifier"] ?? 0, label: "À vérifier", hint: "nouvelles demandes", href: "/prospects?etape=a-verifier" },
    { n: steps["a-attribuer"] ?? 0, label: "À attribuer", hint: "choisir un partenaire", href: "/prospects?etape=a-attribuer" },
    { n: steps["a-transmettre"] ?? 0, label: "À transmettre", hint: "envoyer la fiche", href: "/prospects?etape=a-transmettre" },
    { n: billing.length, label: "À facturer / encaisser", hint: "suivi des paiements", href: "/finances#facturation" },
  ];
  const funnel = [["Reçues", k.leadsReceived], ["Qualifiées", k.leadsQualified], ["Transmises", k.leadsSent], ["Vendues", k.leadsSold]] as const;
  const max = Math.max(1, k.leadsReceived);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">Ce qui vous attend, puis les chiffres.</p>

      <section aria-label="À faire" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {todo.map((t) => (
          <Link key={t.label} href={t.href}
            className={cn("rounded-xl border p-4 transition hover:shadow-sm", t.n > 0 ? "border-indigo-600/30 bg-indigo-600/5" : "bg-card")}>
            <div className={cn("text-3xl font-semibold tabular", t.n > 0 ? "text-indigo-600 dark:text-indigo-300" : "text-muted-foreground")}>{t.n}</div>
            <div className="mt-1 text-sm font-medium">{t.label}</div>
            <div className="text-xs text-muted-foreground">{t.n > 0 ? t.hint + " →" : "rien à faire"}</div>
          </Link>
        ))}
      </section>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Chips active={period} items={PERIODS.map(([key, label]) => ({ key, label, href: q({ period: key }) }))} />
        {d.projects.length > 1 && (
          <Chips active={project ?? "all"} items={[{ key: "all", label: "Tous les sites", href: q({ project: undefined }) },
            ...d.projects.map((p) => ({ key: p.id, label: p.name.replace("[Démo] ", "Démo · "), href: q({ project: p.id }) }))]} />
        )}
      </div>

      <section aria-label="Chiffres clés" className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Demandes reçues", String(k.leadsReceived)], ["Vendues", String(k.leadsSold)], ["Encaissé", eur(k.revenuePaidCents)], ["Marge", eur(k.marginCents)]].map(([l, v], i) => (
          <Card key={l} className="p-4">
            <div className="text-xs text-muted-foreground">{l}</div>
            <div className={cn("mt-1 text-2xl font-semibold tabular", i === 3 && (k.marginCents < 0 ? "text-danger" : "text-success"))}>{v}</div>
          </Card>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Du formulaire à la vente" description="Sur la période sélectionnée" />
          <ul className="space-y-3 p-5">
            {funnel.map(([l, n]) => (
              <li key={l}>
                <div className="flex justify-between text-sm"><span>{l}</span><span className="tabular font-medium">{n}</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${(n / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="border-t px-5 py-3 text-xs text-muted-foreground">
            Prévisionnel {eur(k.revenueForecastCents)} · facturé {eur(k.revenueInvoicedCents)} · dépenses {eur(k.expensesCents)} ·{" "}
            <Link href="/finances" className="text-indigo-600">détail →</Link>
          </p>
        </Card>
        <Card>
          <CardHeader title="Dernières demandes" action={<Link href="/prospects" className="text-xs text-indigo-600">Toutes →</Link>} />
          {d.recent.length === 0 ? <EmptyState title="Aucune demande pour l'instant">Elles arriveront depuis vos sites.</EmptyState> : (
            <ul className="divide-y">
              {d.recent.slice(0, 5).map((l) => (
                <li key={l.id}>
                  <Link href={`/prospects/${l.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{l.fullName}</div>
                      <div className="truncate text-xs text-muted-foreground">{l.postalCode} · {formatDate(l.createdAt)}</div>
                    </div>
                    <Badge tone={LEAD_TONES[l.status]}>{LEAD_STATUSES[l.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
