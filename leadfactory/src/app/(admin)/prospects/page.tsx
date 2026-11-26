import Link from "next/link";
import { Badge, Card, EmptyState, Input } from "@/components/ui";
import { LEAD_STEPS, leadStepCounts, listLeads } from "@/lib/repo/queries";
import { LEAD_STATUSES, LEAD_TONES } from "@/lib/domain/labels";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Prospects" };

function scoreTone(s: number | null) {
  return s === null ? "neutral" : s >= 70 ? "success" : s >= 40 ? "warning" : "danger";
}

export default async function Leads({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const step = LEAD_STEPS.find((s) => s.key === sp.etape);
  const [leads, counts] = await Promise.all([listLeads({ statuses: step?.statuses, q: sp.q }), leadStepCounts()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const tabs = [{ key: "", label: "Toutes", n: total }, ...LEAD_STEPS.map((s) => ({ key: s.key, label: s.label, n: counts[s.key] ?? 0 }))];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospects</h1>
          <p className="mt-1 text-sm text-muted-foreground">{step ? step.hint : "Toutes les demandes reçues par vos sites."}</p>
        </div>
        <form method="get" className="w-full sm:w-64">
          {step && <input type="hidden" name="etape" value={step.key} />}
          <Input name="q" defaultValue={sp.q} placeholder="Rechercher (nom, code postal…)" aria-label="Rechercher" />
        </form>
      </div>

      <nav aria-label="Étapes" className="mt-5 flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <Link key={t.key} href={t.key ? `/prospects?etape=${t.key}` : "/prospects"} aria-current={(step?.key ?? "") === t.key ? "page" : undefined}
            className={cn("-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm whitespace-nowrap",
              (step?.key ?? "") === t.key ? "border-indigo-600 font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t.label}
            <span className={cn("rounded-full px-1.5 text-xs tabular", t.n > 0 && ["a-verifier", "a-attribuer", "a-transmettre"].includes(t.key) ? "bg-indigo-600 text-white" : "bg-muted")}>{t.n}</span>
          </Link>
        ))}
      </nav>

      <Card className="mt-4">
        {leads.length === 0 ? <EmptyState title={step ? `Rien dans « ${step.label} »` : "Aucune demande"}>{step ? "Tout est à jour." : "Les demandes déposées sur vos sites apparaîtront ici."}</EmptyState> : (
          <ul className="divide-y">
            {leads.map((l) => (
              <li key={l.id}>
                <Link href={`/prospects/${l.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted/50 sm:grid-cols-[1fr_8rem_9rem_6rem]">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{l.fullName} {l.isDemo && <Badge tone="warning">Démo</Badge>} {l.duplicateOf && <Badge tone="danger">Doublon</Badge>}</div>
                    <div className="truncate text-xs text-muted-foreground">{l.postalCode} {l.city} · {l.projectName}{l.partnerName ? ` · ${l.partnerName}` : ""}</div>
                  </div>
                  <div className="text-right sm:text-left"><Badge tone={scoreTone(l.score)} className="tabular">Score {l.score ?? "—"}</Badge></div>
                  <div className="hidden sm:block"><Badge tone={LEAD_TONES[l.status]}>{LEAD_STATUSES[l.status]}</Badge></div>
                  <div className="hidden text-right text-xs text-muted-foreground sm:block">{formatDate(l.createdAt, { day: "numeric", month: "short" })}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
