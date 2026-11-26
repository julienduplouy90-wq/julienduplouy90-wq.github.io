import { Field, Input, Select, Textarea } from "@/components/ui";
import { PROJECT_STATUSES } from "@/lib/domain/labels";
import { nicheOptions } from "@/lib/sites/niches";
import type { ProjectRow } from "@/lib/repo/queries";

const euros = (c?: number) => (c === undefined ? "" : String(c / 100).replace(".", ","));

export function ProjectFields({ p, edit = false }: { p?: ProjectRow; edit?: boolean }) {
  const q = (p?.qualification ?? {}) as { qualifyThreshold?: number; rejectThreshold?: number };
  const seo = (p?.seo ?? {}) as { indexable?: boolean; metaDescription?: string };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nom du site"><Input name="name" required defaultValue={p?.name} placeholder="Assainissement Gironde" /></Field>
      <Field label="Identifiant (slug)" hint={edit ? "Non modifiable (URL du site)." : "Minuscules et tirets, utilisé dans l'URL du site."}>
        <Input name="slug" required defaultValue={p?.slug} readOnly={edit} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="assainissement-gironde" />
      </Field>
      <Field label="Niche" hint={edit ? "Non modifiable après création." : "Modèle de services, formulaire et contenus."}>
        <Select name="niche" defaultValue={p?.niche} options={nicheOptions} disabled={edit} />
      </Field>
      {edit && <input type="hidden" name="niche" value={p?.niche} />}
      <Field label="Statut"><Select name="status" defaultValue={p?.status ?? "draft"} options={Object.entries(PROJECT_STATUSES).map(([value, label]) => ({ value, label }))} /></Field>
      <Field label="Pays (ISO)"><Input name="country" defaultValue={p?.country ?? "FR"} maxLength={2} readOnly={edit} /></Field>
      <Field label="Devise (ISO)"><Input name="currency" defaultValue={p?.currency ?? "EUR"} maxLength={3} readOnly={edit} /></Field>
      <Field label="Zone géographique (libellé)"><Input name="zoneLabel" required defaultValue={p?.zoneLabel} placeholder="Gironde (33)" /></Field>
      <Field label="Codes de zone" hint="Départements ou préfixes de codes postaux, séparés par des virgules.">
        <Input name="zoneCodes" required defaultValue={p?.zoneCodes.join(", ")} placeholder="33" />
      </Field>
      <Field label="Domaine (facultatif)"><Input name="domain" defaultValue={p?.domain ?? ""} placeholder="exemple.fr" /></Field>
      <Field label="Prix cible par prospect (€)"><Input name="targetPrice" inputMode="decimal" defaultValue={euros(p?.targetPriceCents ?? 5000)} /></Field>
      <Field label="Budget (€)"><Input name="budget" inputMode="decimal" defaultValue={euros(p?.budgetCents ?? 0)} /></Field>
      <Field label="Prospects offerts par nouveau partenaire"><Input name="freeLeadsPerPartner" type="number" min={0} max={20} defaultValue={p?.freeLeadsPerPartner ?? 2} /></Field>
      <Field label="Objectifs" className="sm:col-span-2"><Textarea name="objectives" defaultValue={p?.objectives ?? ""} /></Field>
      {edit && (
        <>
          <Field label="Seuil « à qualifier » (score)" hint="Recommandation uniquement : la validation reste humaine.">
            <Input name="qualifyThreshold" type="number" min={1} max={100} defaultValue={q.qualifyThreshold ?? 70} />
          </Field>
          <Field label="Seuil « à rejeter » (score)"><Input name="rejectThreshold" type="number" min={0} max={99} defaultValue={q.rejectThreshold ?? 40} /></Field>
          <Field label="Méta-description SEO (facultatif)" className="sm:col-span-2"><Input name="metaDescription" maxLength={160} defaultValue={seo.metaDescription ?? ""} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="indexable" defaultChecked={!!seo.indexable} className="size-4" />
            Autoriser l&apos;indexation par les moteurs de recherche (à activer seulement après publication validée)
          </label>
        </>
      )}
    </div>
  );
}
