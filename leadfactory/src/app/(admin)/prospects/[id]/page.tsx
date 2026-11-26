import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, Notice, Textarea } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/action-form";
import { assignLead, eraseLead, rescore, reviewLead, setAssignmentStatus, setBilling } from "@/lib/actions";
import { getLead, partnerCandidates } from "@/lib/repo/queries";
import { rankPartners } from "@/lib/domain/distribution";
import { LEAD_STATUSES, LEAD_TONES } from "@/lib/domain/labels";
import { formatMoney } from "@/lib/domain/money";
import { getNiche } from "@/lib/sites/niches";
import { cn, formatDate } from "@/lib/utils";

const STEPS = ["Reçu", "Vérifié", "Attribué", "Transmis", "Vendu"];
const STEP_INDEX: Record<string, number> = { new: 0, qualified: 1, assigned: 2, sent: 3, sold: 4 };
const RECO = { qualify: ["Recommandé : qualifier", "success"], review: ["À vérifier attentivement", "warning"], reject: ["Recommandé : rejeter", "danger"] } as const;

function Hidden({ name, value }: { name: string; value: string }) {
  return <input type="hidden" name={name} value={value} />;
}

function NextStep({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border-2 border-indigo-600/40 bg-card p-5" aria-label="Prochaine étape">
      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300">Prochaine étape</p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getLead(id);
  if (!data) notFound();
  const { lead: l, assignments } = data;
  const niche = getNiche(l.niche);
  const service = niche.services.find((s) => s.slug === l.serviceSlug)?.name ?? niche.otherServiceLabel;
  const timeline = niche.timelines.find((t) => t.value === l.timeline)?.label ?? "—";
  const answerRows = niche.questions.map((q) => {
    const v = l.answers[q.id];
    const label = q.kind === "choice" ? q.choices.find((c) => c.value === v)?.label : v === null || v === undefined ? undefined : String(v);
    return [q.label, label ?? "Non renseigné"] as const;
  });
  const live = assignments.find((a) => ["validated", "sent", "accepted"].includes(a.status));
  const ranked = l.status === "qualified"
    ? rankPartners({ postalCode: l.postalCode, serviceSlug: l.serviceSlug === "other" ? null : l.serviceSlug }, await partnerCandidates(l.projectId), l.targetPriceCents)
    : [];
  const eligible = ranked.filter((r) => r.eligible);
  const sd = l.scoreDetails;
  const stepIdx = STEP_INDEX[l.status];
  const sheet = [
    `Demande — ${l.projectName}`, `Projet : ${service}`, `Commune : ${l.city ?? ""} (${l.postalCode})`, ...answerRows.map(([k, v]) => `${k} : ${v}`),
    `Délai : ${timeline}`, l.description ? `Description : ${l.description}` : null, "",
    `Contact : ${l.fullName}`, l.phone ? `Téléphone : ${l.phone}` : null, l.email ? `E-mail : ${l.email}` : null, "",
    `Le demandeur a autorisé la transmission de sa demande à une seule entreprise partenaire (${formatDate(l.consentAt, { dateStyle: "short", timeStyle: "short" })}).`,
  ].filter((x) => x !== null).join("\n");

  let next: ReactNode = null;
  if (l.status === "new") {
    next = (
      <NextStep title="Vérifier la demande">
        {sd && <div className="mb-3 flex flex-wrap gap-2"><Badge tone={RECO[sd.recommendation][1]}>{RECO[sd.recommendation][0]}</Badge>
          {sd.blockers.map((b) => <Badge key={b} tone="danger">{b}</Badge>)}{sd.warnings.map((w) => <Badge key={w} tone="warning">{w}</Badge>)}</div>}
        <form action={reviewLead.bind(null, l.id)} className="space-y-3">
          <Textarea name="note" placeholder="Note (facultatif), ex. : appel de contrôle effectué" rows={2} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" name="decision" value="qualified">Qualifier</Button>
            <Button type="submit" variant="secondary" name="decision" value="rejected">Rejeter</Button>
          </div>
        </form>
      </NextStep>
    );
  } else if (l.status === "qualified") {
    next = (
      <NextStep title={eligible.length ? "Choisir le partenaire" : "Aucun partenaire disponible"}>
        {eligible.length === 0 && <p className="text-sm text-muted-foreground">Aucun partenaire actif ne couvre cette zone et cette prestation. Ajoutez-en un dans <Link href="/partenaires" className="text-indigo-600">Partenaires</Link>.</p>}
        <ul className="space-y-2">
          {eligible.map((r, i) => (
            <li key={r.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">{r.companyName} {i === 0 && <Badge tone="info">conseillé</Badge>}</div>
                <div className="text-xs text-muted-foreground">{r.isFree ? "Prospect offert (période d'essai)" : formatMoney(r.priceCents)} · {r.assignedThisMonth} ce mois{r.capacityLeft !== null ? ` · ${r.capacityLeft} place(s) restante(s)` : ""}</div>
              </div>
              <form action={assignLead.bind(null, l.id)}><Hidden name="partnerId" value={r.id} /><Button type="submit" variant={i === 0 ? "primary" : "secondary"}>Attribuer</Button></form>
            </li>
          ))}
        </ul>
        {ranked.length > eligible.length && (
          <details className="mt-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer">{ranked.length - eligible.length} partenaire(s) non éligible(s)</summary>
            <ul className="mt-2 space-y-1">{ranked.filter((r) => !r.eligible).map((r) => <li key={r.id}>{r.companyName} — {r.reasons.join(", ")}</li>)}</ul>
          </details>
        )}
        <form action={reviewLead.bind(null, l.id)} className="mt-4"><Button type="submit" variant="ghost" name="decision" value="new" className="h-8 text-xs">Revenir à « à vérifier »</Button></form>
      </NextStep>
    );
  } else if (l.status === "assigned" && live) {
    next = (
      <NextStep title={`Transmettre la fiche à ${live.partnerName}`}>
        <p className="text-sm text-muted-foreground">Copiez la fiche et envoyez-la vous-même (e-mail ou téléphone). LeadFactory n&apos;envoie rien.</p>
        <Textarea readOnly rows={10} defaultValue={sheet} className="mt-3 font-mono text-xs" aria-label="Fiche à transmettre" />
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={setAssignmentStatus.bind(null, live.id)}><Hidden name="status" value="sent" /><Button type="submit">C&apos;est envoyé</Button></form>
          <form action={setAssignmentStatus.bind(null, live.id)}><Hidden name="status" value="cancelled" /><Button type="submit" variant="ghost">Changer de partenaire</Button></form>
        </div>
      </NextStep>
    );
  } else if ((l.status === "sent" || l.status === "sold") && live) {
    const paid = live.billingStatus === "paid";
    next = (
      <NextStep title={live.isFree ? `Prospect offert à ${live.partnerName}` : paid ? `Encaissé : ${formatMoney(live.priceCents)}` : live.billingStatus === "invoiced" ? `En attente de paiement de ${live.partnerName}` : `Facturer ${formatMoney(live.priceCents)} à ${live.partnerName}`}>
        <div className="flex flex-wrap gap-2">
          {!live.isFree && live.billingStatus === "forecast" && <form action={setBilling.bind(null, live.id)}><Hidden name="billing" value="invoiced" /><Button type="submit">Facture envoyée</Button></form>}
          {!live.isFree && !paid && <form action={setBilling.bind(null, live.id)}><Hidden name="billing" value="paid" /><Button type="submit" variant={live.billingStatus === "invoiced" ? "primary" : "secondary"}>Paiement reçu</Button></form>}
          {(live.isFree || paid) && <p className="text-sm text-muted-foreground">Rien d&apos;autre à faire pour ce prospect.</p>}
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground">Le partenaire a refusé ou contesté le prospect ?</summary>
          <form action={setAssignmentStatus.bind(null, live.id)} className="mt-2"><Hidden name="status" value="refused" /><Button type="submit" variant="secondary">Marquer comme refusé</Button></form>
        </details>
      </NextStep>
    );
  } else {
    next = (
      <NextStep title="Demande écartée">
        <p className="text-sm text-muted-foreground">{l.status === "rejected" ? "Rejetée lors de la vérification." : "Refusée par le partenaire."}{l.reviewNote ? ` Note : ${l.reviewNote}` : ""}</p>
        {l.status === "rejected" && <form action={reviewLead.bind(null, l.id)} className="mt-3"><Button type="submit" variant="secondary" name="decision" value="new">Revoir cette demande</Button></form>}
      </NextStep>
    );
  }

  return (
    <>
      <Link href="/prospects" className="text-sm text-muted-foreground hover:text-foreground">← Prospects</Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{l.fullName}</h1>
        <Badge tone={LEAD_TONES[l.status]}>{LEAD_STATUSES[l.status]}</Badge>
        {l.isDemo && <Badge tone="warning">Démo — fictif</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{l.projectName} · reçu le {formatDate(l.createdAt, { dateStyle: "long", timeStyle: "short" })}</p>

      <ol className="mt-5 flex items-center gap-1 text-xs" aria-label="Avancement">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-1">
            <span className={cn("h-1.5 rounded-full", stepIdx !== undefined && i <= stepIdx ? "bg-indigo-600" : "bg-muted")} />
            <span className={cn(stepIdx === i ? "font-medium text-foreground" : "text-muted-foreground")}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {next}
          <Card>
            <CardHeader title="La demande" />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[["Projet", service], ["Commune", `${l.city ?? "—"} (${l.postalCode})`], ...answerRows, ["Délai", timeline], ["Téléphone", l.phone ?? "—"], ["E-mail", l.email ?? "—"]].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
              {l.description && <p className="mt-4 rounded-md bg-muted p-3 text-sm whitespace-pre-line">{l.description}</p>}
              {l.duplicateOf && <Notice tone="danger" className="mt-4">Doublon probable de <Link className="underline" href={`/prospects/${l.duplicateOf}`}>cette demande</Link>.</Notice>}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title={`Score ${l.score ?? "—"}/100`} action={<form action={rescore.bind(null, l.id)}><Button variant="ghost" type="submit" className="h-7 text-xs">Recalculer</Button></form>} />
            <CardBody className="space-y-2.5">
              {sd?.checks.map((c) => (
                <div key={c.key} title={c.detail}>
                  <div className="flex justify-between text-xs"><span>{c.label}</span><span className="tabular text-muted-foreground">{c.points}/{c.max}</span></div>
                  <div className="mt-1 h-1 rounded-full bg-muted"><div className="h-1 rounded-full bg-indigo-600" style={{ width: `${c.max ? (c.points / c.max) * 100 : 0}%` }} /></div>
                </div>
              ))}
              <p className="pt-1 text-xs text-muted-foreground">Indicatif : un formulaire complet ne prouve pas l&apos;authenticité.</p>
            </CardBody>
          </Card>
          <details className="rounded-xl border bg-card p-4 text-xs">
            <summary className="cursor-pointer text-sm font-medium">Consentement et traçabilité</summary>
            <div className="mt-3 space-y-2">
              <p>Transmission autorisée : {l.consentTransmission ? "oui" : "non"}, le {formatDate(l.consentAt, { dateStyle: "short", timeStyle: "short" })} (v. {l.consentVersion})</p>
              <blockquote className="border-l-2 pl-3 text-muted-foreground">{l.consentText}</blockquote>
              <p>Source : {l.sourceUrl ?? "—"}</p>
              <p>Conservation jusqu&apos;au {formatDate(l.retentionUntil)}</p>
            </div>
          </details>
          <details className="rounded-xl border bg-card p-4">
            <summary className="cursor-pointer text-sm font-medium">Données personnelles (RGPD)</summary>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`/api/admin/leads/${l.id}/export`} className="inline-flex h-9 items-center rounded-md border px-3.5 text-sm font-medium hover:bg-muted">Exporter</a>
              <form action={eraseLead.bind(null, l.id)}><ConfirmButton message="Effacer les données personnelles de ce prospect ? Action irréversible.">Effacer</ConfirmButton></form>
            </div>
          </details>
        </aside>
      </div>
    </>
  );
}
