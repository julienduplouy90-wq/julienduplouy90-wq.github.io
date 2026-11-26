import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, Notice, PageHeader, Select, Textarea } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/action-form";
import { assignLead, eraseLead, rescore, reviewLead, setAssignmentStatus, setBilling } from "@/lib/actions";
import { getLead, partnerCandidates } from "@/lib/repo/queries";
import { rankPartners } from "@/lib/domain/distribution";
import { ASSIGNMENT_STATUSES, BILLING_STATUSES, LEAD_STATUSES, LEAD_TONES } from "@/lib/domain/labels";
import { formatMoney } from "@/lib/domain/money";
import { getNiche } from "@/lib/sites/niches";
import { formatDate } from "@/lib/utils";

const RECO = { qualify: ["Recommandé : qualifier", "success"], review: ["Revue attentive recommandée", "warning"], reject: ["Recommandé : rejeter", "danger"] } as const;

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
  const sd = l.scoreDetails;
  const sheet = [
    `Demande — ${l.projectName}`, `Projet : ${service}`, `Commune : ${l.city ?? ""} (${l.postalCode})`, ...answerRows.map(([k, v]) => `${k} : ${v}`),
    `Délai : ${timeline}`, l.description ? `Description : ${l.description}` : null, "",
    `Contact : ${l.fullName}`, l.phone ? `Téléphone : ${l.phone}` : null, l.email ? `E-mail : ${l.email}` : null, "",
    `Le demandeur a autorisé la transmission de sa demande à une seule entreprise partenaire (${formatDate(l.consentAt, { dateStyle: "short", timeStyle: "short" })}).`,
  ].filter((x) => x !== null).join("\n");

  return (
    <>
      <PageHeader title={l.fullName}
        description={<span className="flex flex-wrap items-center gap-2">{l.projectName} · reçu le {formatDate(l.createdAt, { dateStyle: "long", timeStyle: "short" })}
          <Badge tone={LEAD_TONES[l.status]}>{LEAD_STATUSES[l.status]}</Badge>{l.isDemo && <Badge tone="warning">Démo — fictif</Badge>}</span>}
        actions={<Link href="/prospects" className="text-sm text-primary">← Prospects</Link>} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Demande" />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[["Nature du projet", service], ["Commune", `${l.city ?? "—"} (${l.postalCode})`], ...answerRows, ["Délai", timeline],
                  ["Téléphone", l.phone ?? "—"], ["E-mail", l.email ?? "—"]].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
              {l.description && <p className="mt-4 rounded-md bg-muted p-3 text-sm whitespace-pre-line">{l.description}</p>}
              {l.duplicateOf && <Notice tone="danger" className="mt-4">Doublon probable de <Link className="underline" href={`/prospects/${l.duplicateOf}`}>cette demande</Link>.</Notice>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Distribution" description="Attribution exclusive à un seul partenaire, validée manuellement." />
            <CardBody className="space-y-4">
              {l.status === "new" && <p className="text-sm text-muted-foreground">Qualifiez d&apos;abord ce prospect pour pouvoir l&apos;attribuer.</p>}
              {l.status === "rejected" && <p className="text-sm text-muted-foreground">Prospect rejeté : aucune attribution possible.</p>}
              {l.status === "qualified" && (ranked.length === 0 ? <p className="text-sm text-muted-foreground">Aucun partenaire dans le CRM.</p> : (
                <ul className="divide-y rounded-md border">
                  {ranked.map((r) => (
                    <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-medium">{r.companyName} {r.linkedToProject && <Badge tone="info">lié au projet</Badge>}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.eligible ? `${r.isFree ? "Prospect offert" : formatMoney(r.priceCents)} · ${r.assignedThisMonth} ce mois${r.capacityLeft !== null ? ` · reste ${r.capacityLeft}` : ""}` : r.reasons.join(" · ")}
                        </div>
                      </div>
                      {r.eligible && (
                        <form action={assignLead.bind(null, l.id)}>
                          <input type="hidden" name="partnerId" value={r.id} />
                          <Button type="submit">Attribuer</Button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
              {assignments.map((a) => (
                <div key={a.id} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/partenaires/${a.partnerId}`} className="font-medium hover:underline">{a.partnerName}</Link>
                    <Badge>{ASSIGNMENT_STATUSES[a.status]}</Badge>
                    <Badge tone="info">{a.isFree ? "Offert" : formatMoney(a.priceCents)}</Badge>
                    <Badge>{BILLING_STATUSES[a.billingStatus]}</Badge>
                  </div>
                  {a === live && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {a.status === "validated" && (
                        <form action={setAssignmentStatus.bind(null, a.id)}><input type="hidden" name="status" value="sent" /><Button type="submit">Marquer comme transmis</Button></form>
                      )}
                      {a.status !== "accepted" && a.status !== "validated" && (
                        <form action={setAssignmentStatus.bind(null, a.id)}><input type="hidden" name="status" value="accepted" /><Button variant="secondary" type="submit">Accepté par le partenaire</Button></form>
                      )}
                      {a.status !== "validated" && (
                        <form action={setAssignmentStatus.bind(null, a.id)}><input type="hidden" name="status" value="refused" /><Button variant="secondary" type="submit">Refusé par le partenaire</Button></form>
                      )}
                      <form action={setAssignmentStatus.bind(null, a.id)}><input type="hidden" name="status" value="cancelled" /><Button variant="ghost" type="submit">Annuler l&apos;attribution</Button></form>
                      {!a.isFree && a.status !== "validated" && (
                        <form action={setBilling.bind(null, a.id)} className="flex gap-2">
                          <Select name="billing" defaultValue={a.billingStatus} className="w-40" options={Object.entries(BILLING_STATUSES).map(([value, label]) => ({ value, label }))} />
                          <Button variant="secondary" type="submit">Mettre à jour</Button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {live && (
                <details className="rounded-md border p-3 text-sm">
                  <summary className="cursor-pointer font-medium">Fiche à transmettre (copier-coller)</summary>
                  <p className="mt-2 text-xs text-muted-foreground">LeadFactory n&apos;envoie rien : transmettez cette fiche vous-même (e-mail ou téléphone), puis cliquez sur « Marquer comme transmis ».</p>
                  <Textarea readOnly rows={12} defaultValue={sheet} className="mt-2 font-mono text-xs" />
                </details>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={`Score : ${l.score ?? "—"} / 100`} action={<form action={rescore.bind(null, l.id)}><Button variant="ghost" type="submit" className="h-7 text-xs">Recalculer</Button></form>} />
            <CardBody className="space-y-3">
              {sd && <Badge tone={RECO[sd.recommendation][1]}>{RECO[sd.recommendation][0]}</Badge>}
              {sd?.checks.map((c) => (
                <div key={c.key}>
                  <div className="flex justify-between text-xs"><span>{c.label}</span><span className="tabular text-muted-foreground">{c.points}/{c.max}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${c.max ? (c.points / c.max) * 100 : 0}%` }} /></div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{c.detail}</div>
                </div>
              ))}
              {sd && sd.blockers.length > 0 && <Notice tone="danger"><b>Bloquant :</b> {sd.blockers.join(", ")}</Notice>}
              {sd && sd.warnings.length > 0 && <Notice tone="warning"><b>À vérifier :</b> {sd.warnings.join(", ")}</Notice>}
              <p className="text-xs text-muted-foreground">Un formulaire complet ne prouve pas l&apos;authenticité : vérifiez (appel de contrôle si besoin) avant de qualifier.</p>
            </CardBody>
          </Card>

          {["new", "qualified", "rejected"].includes(l.status) && (
            <Card>
              <CardHeader title="Validation humaine" />
              <CardBody>
                <form action={reviewLead.bind(null, l.id)} className="space-y-3">
                  <Textarea name="note" placeholder="Note (facultatif)" defaultValue={l.reviewNote ?? ""} />
                  <div className="flex flex-wrap gap-2">
                    {l.status !== "qualified" && <Button type="submit" name="decision" value="qualified">Qualifier</Button>}
                    {l.status !== "rejected" && <Button type="submit" variant="secondary" name="decision" value="rejected">Rejeter</Button>}
                    {l.status !== "new" && <Button type="submit" variant="ghost" name="decision" value="new">Remettre à « Nouveau »</Button>}
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Consentement et traçabilité" />
            <CardBody className="space-y-2 text-xs">
              <p><b>Transmission autorisée :</b> {l.consentTransmission ? "oui" : "non"} — {formatDate(l.consentAt, { dateStyle: "short", timeStyle: "short" })} (version {l.consentVersion})</p>
              <blockquote className="border-l-2 pl-3 text-muted-foreground">{l.consentText}</blockquote>
              <p><b>Source :</b> {l.sourceUrl ?? "—"}</p>
              <p><b>Conservation jusqu&apos;au :</b> {formatDate(l.retentionUntil)}</p>
              {l.reviewedAt && <p><b>Revu le :</b> {formatDate(l.reviewedAt, { dateStyle: "short", timeStyle: "short" })}</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Données personnelles (RGPD)" />
            <CardBody className="flex flex-wrap gap-2">
              <a href={`/api/admin/leads/${l.id}/export`} className="inline-flex h-9 items-center rounded-md border bg-card px-3.5 text-sm font-medium hover:bg-muted">Exporter (JSON)</a>
              <form action={eraseLead.bind(null, l.id)}>
                <ConfirmButton message="Effacer les données personnelles de ce prospect ? (anonymisation si déjà attribué) Action irréversible.">Effacer les données</ConfirmButton>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
