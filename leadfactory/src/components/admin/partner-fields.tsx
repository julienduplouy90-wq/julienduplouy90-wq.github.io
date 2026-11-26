import { Field, Input, Select, Textarea } from "@/components/ui";
import { PARTNER_STATUSES } from "@/lib/domain/labels";
import type { PartnerRow } from "@/lib/repo/queries";
import type { NicheService } from "@/lib/sites/types";

export function PartnerFields({ p, services, projects }: { p?: PartnerRow; services: NicheService[]; projects?: { id: string; name: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Entreprise"><Input name="companyName" required defaultValue={p?.companyName} /></Field>
      <Field label="Statut"><Select name="status" defaultValue={p?.status ?? "to_contact"} options={Object.entries(PARTNER_STATUSES).map(([value, label]) => ({ value, label }))} /></Field>
      <Field label="Nom du contact"><Input name="contactName" defaultValue={p?.contactName ?? ""} /></Field>
      <Field label="E-mail"><Input name="email" type="email" defaultValue={p?.email ?? ""} /></Field>
      <Field label="Téléphone"><Input name="phone" type="tel" defaultValue={p?.phone ?? ""} /></Field>
      <Field label="Site internet"><Input name="website" defaultValue={p?.website ?? ""} /></Field>
      <Field label="Adresse" className="sm:col-span-2"><Input name="address" defaultValue={p?.address ?? ""} /></Field>
      <Field label="Zone d'intervention (libellé)"><Input name="zoneLabel" defaultValue={p?.zoneLabel ?? ""} placeholder="Dordogne nord" /></Field>
      <Field label="Codes de zone" hint="Départements ou préfixes de codes postaux (ex. 24, 2410)."><Input name="zoneCodes" defaultValue={p?.zoneCodes.join(", ")} /></Field>
      <Field label="Prix accepté par prospect (€)"><Input name="acceptedPrice" inputMode="decimal" defaultValue={p?.acceptedPriceCents != null ? String(p.acceptedPriceCents / 100) : ""} /></Field>
      <Field label="Capacité mensuelle (prospects)"><Input name="monthlyCapacity" type="number" min={0} defaultValue={p?.monthlyCapacity ?? ""} /></Field>
      <Field label="Source des coordonnées" hint="Obligatoire en pratique (RGPD) : annuaire, site officiel, recommandation…"><Input name="source" defaultValue={p?.source ?? ""} /></Field>
      <Field label="Date de vérification"><Input name="verifiedAt" type="date" defaultValue={p?.verifiedAt ?? ""} /></Field>
      <fieldset className="sm:col-span-2">
        <legend className="text-xs font-medium text-muted-foreground">Services proposés</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label key={s.slug} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="services" value={s.slug} defaultChecked={p?.services.includes(s.slug)} className="size-4" /> {s.name}
            </label>
          ))}
        </div>
      </fieldset>
      {projects && (
        <Field label="Associer à un projet (facultatif)"><Select name="projectId" defaultValue="" options={[{ value: "", label: "—" }, ...projects.map((x) => ({ value: x.id, label: x.name }))]} /></Field>
      )}
      <Field label="Notes" className="sm:col-span-2"><Textarea name="notes" defaultValue={p?.notes ?? ""} /></Field>
    </div>
  );
}
