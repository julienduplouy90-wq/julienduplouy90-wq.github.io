import { z } from "zod";
import { parseMoneyToCents } from "./money";
import { normalizeEmail, normalizePhoneFR } from "./contact";
import { PARTNER_STATUSES } from "./labels";

/** Parseur CSV RFC 4180 minimal (guillemets, retours à la ligne échappés). Séparateur ; ou , détecté. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

const ALIASES: Record<string, string[]> = {
  company_name: ["entreprise", "nom de l'entreprise", "societe", "société", "raison sociale", "company", "company_name", "nom"],
  contact_name: ["contact", "nom du contact", "contact_name", "interlocuteur"],
  email: ["email", "e-mail", "mail", "courriel"],
  phone: ["telephone", "téléphone", "tel", "tél", "phone"],
  website: ["site", "site internet", "site web", "website", "url"],
  address: ["adresse", "address"],
  zone_label: ["zone", "zone d'intervention", "secteur"],
  zone_codes: ["codes zone", "departements", "départements", "zone_codes"],
  services: ["services", "prestations", "services proposés"],
  accepted_price: ["prix", "prix accepté", "prix par prospect", "accepted_price"],
  monthly_capacity: ["capacité", "capacite", "capacité mensuelle", "monthly_capacity"],
  status: ["statut", "status"],
  source: ["source", "source des coordonnées", "provenance"],
  verified_at: ["date de vérification", "verifie le", "vérifié le", "verified_at"],
  notes: ["notes", "remarques", "commentaire"],
};

const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function mapHeaders(headers: string[]): Record<number, string> {
  const map: Record<number, string> = {};
  headers.forEach((h, i) => {
    const n = norm(h);
    for (const [field, aliases] of Object.entries(ALIASES)) {
      if (aliases.some((a) => norm(a) === n)) { map[i] = field; break; }
    }
  });
  return map;
}

const STATUS_FROM_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(PARTNER_STATUSES).flatMap(([k, label]) => [[norm(label), k], [k, k]]),
);

const list = (s: string | undefined) => (s ?? "").split(/[|,;/]/).map((x) => x.trim()).filter(Boolean);

export const partnerImportSchema = z.object({
  company_name: z.string().trim().min(2, "Nom de l'entreprise requis").max(200),
  contact_name: z.string().trim().max(200).nullable(),
  email: z.email("E-mail invalide").nullable(),
  phone: z.string().max(30).nullable(),
  website: z.string().trim().max(300).nullable(),
  address: z.string().trim().max(300).nullable(),
  zone_label: z.string().trim().max(200).nullable(),
  zone_codes: z.array(z.string().regex(/^[0-9AB]{2,5}$/i, "Code de zone invalide")),
  services: z.array(z.string().max(80)),
  accepted_price_cents: z.number().int().nonnegative().nullable(),
  monthly_capacity: z.number().int().nonnegative().nullable(),
  status: z.enum(Object.keys(PARTNER_STATUSES) as [string, ...string[]]),
  source: z.string().trim().max(300).nullable(),
  verified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue AAAA-MM-JJ").nullable(),
  notes: z.string().max(5000).nullable(),
});
export type PartnerImportRow = z.infer<typeof partnerImportSchema>;

/** Convertit un CSV en lignes partenaires validées + erreurs par ligne (numéro de ligne du fichier). */
export function parsePartnersCsv(text: string): { rows: PartnerImportRow[]; errors: { line: number; message: string }[] } {
  const all = parseCsv(text);
  if (all.length < 2) return { rows: [], errors: [{ line: 1, message: "Fichier vide ou sans ligne de données" }] };
  const map = mapHeaders(all[0]!);
  if (!Object.values(map).includes("company_name")) return { rows: [], errors: [{ line: 1, message: "Colonne « Entreprise » introuvable" }] };
  const rows: PartnerImportRow[] = [];
  const errors: { line: number; message: string }[] = [];
  all.slice(1).forEach((cells, idx) => {
    const rec: Record<string, string> = {};
    cells.forEach((v, i) => { const f = map[i]; if (f) rec[f] = v.trim(); });
    const opt = (k: string) => (rec[k] ? rec[k]! : null);
    const verified = opt("verified_at");
    const frDate = verified?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const candidate = {
      company_name: rec.company_name ?? "",
      contact_name: opt("contact_name"),
      email: normalizeEmail(opt("email")),
      phone: normalizePhoneFR(opt("phone")),
      website: opt("website"),
      address: opt("address"),
      zone_label: opt("zone_label"),
      zone_codes: list(rec.zone_codes),
      services: list(rec.services),
      accepted_price_cents: parseMoneyToCents(opt("accepted_price")),
      monthly_capacity: rec.monthly_capacity ? Number(rec.monthly_capacity) : null,
      status: STATUS_FROM_LABEL[norm(rec.status ?? "")] ?? "to_contact",
      source: opt("source"),
      verified_at: frDate ? `${frDate[3]}-${frDate[2]}-${frDate[1]}` : verified,
      notes: opt("notes"),
    };
    const r = partnerImportSchema.safeParse(candidate);
    if (r.success) rows.push(r.data);
    else errors.push({ line: idx + 2, message: r.error.issues.map((i) => `${i.path.join(".")} : ${i.message}`).join(" ; ") });
  });
  return { rows, errors };
}
