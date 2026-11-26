"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, getWorkspaceId } from "@/lib/db";
import { audit } from "@/lib/repo/audit";
import { rescoreLead } from "@/lib/repo/lead-intake";
import { partnerCandidates } from "@/lib/repo/queries";
import { rankPartners } from "@/lib/domain/distribution";
import { parsePartnersCsv } from "@/lib/domain/csv";
import { parseMoneyToCents } from "@/lib/domain/money";
import { normalizeEmail, normalizePhoneFR } from "@/lib/domain/contact";
import { expenseInputSchema, projectInputSchema } from "@/lib/domain/lead-schema";
import { PARTNER_STATUSES } from "@/lib/domain/labels";
import { getNiche } from "@/lib/sites/niches";
import { str } from "@/lib/utils";

const ACTOR = "admin"; // Futur : identifiant de l'utilisateur Supabase Auth.
export type ActionState = { ok: boolean; message: string; errors?: string[] } | null;

const codes = (s: string) => s.split(/[\s,;]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);
const intOrNull = (s: string) => (s === "" ? null : Number.isFinite(Number(s)) ? Math.trunc(Number(s)) : NaN);
const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".") || "champ"} : ${i.message}`);

/* ─────────── Projets ─────────── */

function readProject(fd: FormData) {
  return projectInputSchema.safeParse({
    name: str(fd.get("name")), slug: str(fd.get("slug")), niche: str(fd.get("niche")), country: str(fd.get("country")) || "FR",
    currency: str(fd.get("currency")) || "EUR", zoneLabel: str(fd.get("zoneLabel")), zoneCodes: codes(str(fd.get("zoneCodes"))),
    domain: str(fd.get("domain")) || null, status: str(fd.get("status")) || "draft",
    targetPriceCents: parseMoneyToCents(str(fd.get("targetPrice"))) ?? 0, budgetCents: parseMoneyToCents(str(fd.get("budget"))) ?? 0,
    freeLeadsPerPartner: Number(str(fd.get("freeLeadsPerPartner")) || 2), objectives: str(fd.get("objectives")) || null,
  });
}

export async function createProject(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = readProject(fd);
  if (!parsed.success) return { ok: false, message: "Formulaire invalide", errors: issues(parsed.error) };
  const p = parsed.data;
  let niche;
  try { niche = getNiche(p.niche); } catch { return { ok: false, message: "Niche inconnue" }; }
  const db = await getDb();
  const ws = await getWorkspaceId();
  let id: string;
  try {
    id = await db.tx(async (t) => {
      const [row] = await t.query<{ id: string }>(
        `insert into projects (workspace_id, slug, name, niche, country, currency, zone_label, zone_codes, domain, status, target_price_cents,
            budget_cents, free_leads_per_partner, objectives, seo, qualification)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'{"indexable":false}'::jsonb,'{"qualifyThreshold":70,"rejectThreshold":40}'::jsonb) returning id`,
        [ws, p.slug, p.name, p.niche, p.country, p.currency, p.zoneLabel, p.zoneCodes, p.domain, p.status, p.targetPriceCents, p.budgetCents, p.freeLeadsPerPartner, p.objectives]);
      for (const [i, s] of niche.services.entries()) {
        await t.query("insert into services (project_id, slug, name, summary, sort) values ($1,$2,$3,$4,$5)", [row!.id, s.slug, s.name, s.summary, i]);
      }
      await t.query(`insert into sites (workspace_id, project_id, slug, status, content) values ($1,$2,$3,'draft','{"publisher":{}}'::jsonb)`, [ws, row!.id, p.slug]);
      await audit(t, ws, ACTOR, "project.created", "project", row!.id, { slug: p.slug });
      return row!.id;
    });
  } catch (e) {
    return { ok: false, message: String(e).includes("unique") || String(e).includes("duplicate") ? "Ce slug est déjà utilisé" : "Erreur lors de la création" };
  }
  revalidatePath("/sites");
  redirect(`/sites/${id}`);
}

export async function updateProject(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = readProject(fd);
  if (!parsed.success) return { ok: false, message: "Formulaire invalide", errors: issues(parsed.error) };
  const p = parsed.data;
  const db = await getDb();
  const ws = await getWorkspaceId();
  const qualifyThreshold = Number(str(fd.get("qualifyThreshold")) || 70);
  const rejectThreshold = Number(str(fd.get("rejectThreshold")) || 40);
  if (!(rejectThreshold >= 0 && qualifyThreshold <= 100 && rejectThreshold < qualifyThreshold)) return { ok: false, message: "Seuils de qualification incohérents" };
  await db.query(
    `update projects set name=$3, zone_label=$4, zone_codes=$5, domain=$6, status=$7, target_price_cents=$8, budget_cents=$9,
        free_leads_per_partner=$10, objectives=$11, qualification = qualification || $12::jsonb,
        seo = seo || $13::jsonb, updated_at=now() where workspace_id=$1 and id=$2`,
    [ws, id, p.name, p.zoneLabel, p.zoneCodes, p.domain, p.status, p.targetPriceCents, p.budgetCents, p.freeLeadsPerPartner, p.objectives,
      JSON.stringify({ qualifyThreshold, rejectThreshold }),
      JSON.stringify({ indexable: fd.get("indexable") === "on", metaDescription: str(fd.get("metaDescription")) || undefined })]);
  await audit(db, ws, ACTOR, "project.updated", "project", id);
  revalidatePath(`/sites/${id}`);
  return { ok: true, message: "Projet enregistré" };
}

/* ─────────── Sites ─────────── */

export async function updateSite(siteId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const status = str(fd.get("status"));
  if (!["draft", "preview"].includes(status)) return { ok: false, message: "La publication nécessite votre autorisation explicite et n'est pas disponible dans le MVP." };
  const publisher = Object.fromEntries(
    ["name", "legalForm", "siret", "address", "email", "director", "host"].map((k) => [k, str(fd.get(k)).slice(0, 300)]).filter(([, v]) => v !== ""),
  );
  const db = await getDb();
  const ws = await getWorkspaceId();
  await db.query(`update sites set status=$3, content = jsonb_set(content, '{publisher}', $4::jsonb), updated_at=now() where workspace_id=$1 and id=$2`,
    [ws, siteId, status, JSON.stringify(publisher)]);
  await audit(db, ws, ACTOR, "site.updated", "site", siteId, { status });
  revalidatePath("/sites");
  return { ok: true, message: "Site enregistré" };
}

/* ─────────── Partenaires ─────────── */

const partnerSchema = z.object({
  companyName: z.string().min(2).max(200),
  contactName: z.string().max(200).nullable(),
  email: z.email().nullable(),
  phone: z.string().max(30).nullable(),
  website: z.string().max(300).nullable(),
  address: z.string().max(300).nullable(),
  zoneLabel: z.string().max(200).nullable(),
  zoneCodes: z.array(z.string().regex(/^[0-9AB]{2,5}$/)),
  services: z.array(z.string().max(80)),
  acceptedPriceCents: z.number().int().nonnegative().nullable(),
  monthlyCapacity: z.number().int().nonnegative().nullable(),
  status: z.enum(Object.keys(PARTNER_STATUSES) as [string, ...string[]]),
  source: z.string().max(300).nullable(),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  notes: z.string().max(5000).nullable(),
});

function readPartner(fd: FormData) {
  const o = (k: string) => str(fd.get(k)) || null;
  return partnerSchema.safeParse({
    companyName: str(fd.get("companyName")), contactName: o("contactName"), email: normalizeEmail(o("email")), phone: normalizePhoneFR(o("phone")),
    website: o("website"), address: o("address"), zoneLabel: o("zoneLabel"), zoneCodes: codes(str(fd.get("zoneCodes"))),
    services: fd.getAll("services").map(String), acceptedPriceCents: parseMoneyToCents(str(fd.get("acceptedPrice"))),
    monthlyCapacity: intOrNull(str(fd.get("monthlyCapacity"))), status: str(fd.get("status")) || "to_contact",
    source: o("source"), verifiedAt: o("verifiedAt"), notes: o("notes"),
  });
}

export async function savePartner(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = readPartner(fd);
  if (!parsed.success) return { ok: false, message: "Formulaire invalide", errors: issues(parsed.error) };
  const p = parsed.data;
  const db = await getDb();
  const ws = await getWorkspaceId();
  const vals = [p.companyName, p.contactName, p.email, p.phone, p.website, p.address, p.zoneLabel, p.zoneCodes, p.services, p.acceptedPriceCents,
    p.monthlyCapacity, p.status, p.source, p.verifiedAt, p.notes];
  let pid = id;
  if (id) {
    await db.query(
      `update partners set company_name=$3, contact_name=$4, email=$5, phone=$6, website=$7, address=$8, zone_label=$9, zone_codes=$10, services=$11,
          accepted_price_cents=$12, monthly_capacity=$13, status=$14, source=$15, verified_at=$16, notes=$17, updated_at=now(),
          opted_out_at = case when $14 = 'opted_out' then coalesce(opted_out_at, now()) else opted_out_at end
        where workspace_id=$1 and id=$2`, [ws, id, ...vals]);
    await audit(db, ws, ACTOR, "partner.updated", "partner", id, { status: p.status });
  } else {
    const [r] = await db.query<{ id: string }>(
      `insert into partners (workspace_id, company_name, contact_name, email, phone, website, address, zone_label, zone_codes, services,
          accepted_price_cents, monthly_capacity, status, source, verified_at, notes) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) returning id`,
      [ws, ...vals]);
    pid = r!.id;
    await audit(db, ws, ACTOR, "partner.created", "partner", pid);
  }
  const projectId = str(fd.get("projectId"));
  if (projectId) await linkPartner(pid!, projectId, p.acceptedPriceCents);
  revalidatePath("/partenaires");
  if (!id) redirect(`/partenaires/${pid}`);
  revalidatePath(`/partenaires/${id}`);
  return { ok: true, message: "Partenaire enregistré" };
}

async function linkPartner(partnerId: string, projectId: string, priceCents: number | null) {
  const db = await getDb();
  const ws = await getWorkspaceId();
  await db.query(
    `insert into partner_projects (partner_id, project_id, agreed_price_cents, free_leads_granted)
       select $1, pr.id, $3, pr.free_leads_per_partner from projects pr join partners pa on pa.id = $1 and pa.workspace_id = $4
        where pr.id = $2 and pr.workspace_id = $4
     on conflict (partner_id, project_id) do update set active = true, agreed_price_cents = coalesce(excluded.agreed_price_cents, partner_projects.agreed_price_cents)`,
    [partnerId, projectId, priceCents, ws]);
}

export async function linkPartnerToProject(partnerId: string, fd: FormData) {
  const projectId = str(fd.get("projectId"));
  if (!z.uuid().safeParse(projectId).success) return;
  await linkPartner(partnerId, projectId, parseMoneyToCents(str(fd.get("agreedPrice"))));
  revalidatePath(`/partenaires/${partnerId}`);
}

export async function addInteraction(partnerId: string, fd: FormData) {
  const summary = str(fd.get("summary")).slice(0, 2000);
  const channel = str(fd.get("channel"));
  if (summary.length < 2 || !["email", "phone", "meeting", "other"].includes(channel)) return;
  const db = await getDb();
  const ws = await getWorkspaceId();
  const [ok] = await db.query("select 1 from partners where id=$1 and workspace_id=$2", [partnerId, ws]);
  if (!ok) return;
  await db.query("insert into partner_interactions (partner_id, occurred_at, channel, summary) values ($1, coalesce($2::timestamptz, now()), $3, $4)",
    [partnerId, str(fd.get("occurredAt")) || null, channel, summary]);
  revalidatePath(`/partenaires/${partnerId}`);
}

export async function importPartners(_: ActionState, fd: FormData): Promise<ActionState> {
  const file = fd.get("file");
  let text = str(fd.get("csv"));
  if (file instanceof File && file.size > 0) {
    if (file.size > 1_000_000) return { ok: false, message: "Fichier trop volumineux (1 Mo max)" };
    text = await file.text();
  }
  if (!text) return { ok: false, message: "Aucun contenu CSV" };
  const { rows, errors } = parsePartnersCsv(text);
  const db = await getDb();
  const ws = await getWorkspaceId();
  let created = 0, skipped = 0;
  await db.tx(async (t) => {
    for (const r of rows) {
      const [exists] = await t.query(
        "select 1 from partners where workspace_id=$1 and (lower(company_name)=lower($2) or ($3::text is not null and email=$3))", [ws, r.company_name, r.email]);
      if (exists) { skipped++; continue; }
      await t.query(
        `insert into partners (workspace_id, company_name, contact_name, email, phone, website, address, zone_label, zone_codes, services,
            accepted_price_cents, monthly_capacity, status, source, verified_at, notes) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [ws, r.company_name, r.contact_name, r.email, r.phone, r.website, r.address, r.zone_label, r.zone_codes, r.services, r.accepted_price_cents,
          r.monthly_capacity, r.status, r.source, r.verified_at, r.notes]);
      created++;
    }
    await audit(t, ws, ACTOR, "partner.imported", "partner", null, { created, skipped, errors: errors.length });
  });
  revalidatePath("/partenaires");
  return {
    ok: errors.length === 0,
    message: `${created} partenaire(s) importé(s), ${skipped} doublon(s) ignoré(s), ${errors.length} ligne(s) en erreur`,
    errors: errors.map((e) => `Ligne ${e.line} : ${e.message}`),
  };
}

/* ─────────── Prospects ─────────── */

export async function reviewLead(leadId: string, fd: FormData) {
  const decision = str(fd.get("decision"));
  if (!["qualified", "rejected", "new"].includes(decision)) return;
  const db = await getDb();
  const ws = await getWorkspaceId();
  const [l] = await db.query<{ status: string }>("select status from leads where id=$1 and workspace_id=$2", [leadId, ws]);
  if (!l || !["new", "qualified", "rejected"].includes(l.status)) return; // déjà attribué : passer par l'attribution
  await db.query("update leads set status=$3, reviewed_at = case when $3 = 'new' then null else now() end, review_note=$4 where id=$1 and workspace_id=$2",
    [leadId, ws, decision, str(fd.get("note")).slice(0, 1000) || null]);
  await audit(db, ws, ACTOR, `lead.${decision}`, "lead", leadId);
  revalidatePath(`/prospects/${leadId}`);
  revalidatePath("/prospects");
}

export async function rescore(leadId: string) {
  const db = await getDb();
  await rescoreLead(db, await getWorkspaceId(), leadId);
  revalidatePath(`/prospects/${leadId}`);
}

export async function assignLead(leadId: string, fd: FormData): Promise<void> {
  const partnerId = str(fd.get("partnerId"));
  const db = await getDb();
  const ws = await getWorkspaceId();
  const [lead] = await db.query<{ status: string; projectId: string; postalCode: string; serviceSlug: string | null; target: number; isDemo: boolean }>(
    `select l.status, l.project_id as "projectId", l.postal_code as "postalCode", l.service_slug as "serviceSlug", p.target_price_cents as target, l.is_demo as "isDemo"
       from leads l join projects p on p.id = l.project_id where l.id=$1 and l.workspace_id=$2`, [leadId, ws]);
  if (!lead || lead.status !== "qualified") throw new Error("Seul un prospect qualifié (validé manuellement) peut être attribué");
  const ranked = rankPartners({ postalCode: lead.postalCode, serviceSlug: lead.serviceSlug === "other" ? null : lead.serviceSlug }, await partnerCandidates(lead.projectId), lead.target);
  const choice = ranked.find((r) => r.id === partnerId);
  if (!choice?.eligible) throw new Error("Partenaire non éligible pour ce prospect");
  await db.tx(async (t) => {
    // L'index unique partiel garantit l'exclusivité même en cas de double clic.
    await t.query(
      `insert into lead_assignments (workspace_id, lead_id, partner_id, status, price_cents, is_free, billing_status, is_demo)
       values ($1,$2,$3,'validated',$4,$5,$6,$7)`,
      [ws, leadId, partnerId, choice.priceCents, choice.isFree, choice.isFree ? "not_billable" : "forecast", lead.isDemo]);
    await t.query("update leads set status='assigned' where id=$1", [leadId]);
    await audit(t, ws, ACTOR, "lead.assigned", "lead", leadId, { partnerId, priceCents: choice.priceCents, isFree: choice.isFree });
  });
  revalidatePath(`/prospects/${leadId}`);
  revalidatePath("/leads");
}

const NEXT_LEAD_STATUS: Record<string, string> = { sent: "sent", accepted: "sent", refused: "refused_by_partner", cancelled: "qualified" };

export async function setAssignmentStatus(assignmentId: string, fd: FormData) {
  const status = str(fd.get("status"));
  if (!(status in NEXT_LEAD_STATUS)) return;
  const db = await getDb();
  const ws = await getWorkspaceId();
  await db.tx(async (t) => {
    const [a] = await t.query<{ leadId: string; status: string }>(
      `select lead_id as "leadId", status from lead_assignments where id=$1 and workspace_id=$2`, [assignmentId, ws]);
    if (!a) return;
    await t.query(
      `update lead_assignments set status=$2, sent_at = case when $2='sent' then now() else sent_at end,
          billing_status = case when $2 in ('refused','cancelled') then 'not_billable' else billing_status end where id=$1`, [assignmentId, status]);
    await t.query("update leads set status=$2 where id=$1", [a.leadId, NEXT_LEAD_STATUS[status]]);
    await audit(t, ws, ACTOR, `assignment.${status}`, "lead_assignment", assignmentId);
  });
  revalidatePath("/leads");
  revalidatePath("/prospects");
}

export async function setBilling(assignmentId: string, fd: FormData) {
  const billing = str(fd.get("billing"));
  if (!["forecast", "invoiced", "paid", "not_billable"].includes(billing)) return;
  const db = await getDb();
  const ws = await getWorkspaceId();
  await db.tx(async (t) => {
    const [a] = await t.query<{ leadId: string; status: string }>(`select lead_id as "leadId", status from lead_assignments where id=$1 and workspace_id=$2`, [assignmentId, ws]);
    if (!a) return;
    await t.query(
      `update lead_assignments set billing_status=$2,
          invoiced_at = case when $2 in ('invoiced','paid') then coalesce(invoiced_at, now()) else null end,
          paid_at = case when $2 = 'paid' then coalesce(paid_at, now()) else null end where id=$1`, [assignmentId, billing]);
    if (["sent", "accepted"].includes(a.status)) {
      await t.query("update leads set status=$2 where id=$1", [a.leadId, billing === "invoiced" || billing === "paid" ? "sold" : "sent"]);
    }
    await audit(t, ws, ACTOR, `billing.${billing}`, "lead_assignment", assignmentId);
  });
  revalidatePath("/finances");
  revalidatePath("/prospects");
}

/** Droit à l'effacement : suppression si aucune attribution, sinon anonymisation (historique financier conservé). */
export async function eraseLead(leadId: string) {
  const db = await getDb();
  const ws = await getWorkspaceId();
  const [{ n }] = (await db.query<{ n: number }>("select count(*)::int n from lead_assignments where lead_id=$1", [leadId])) as [{ n: number }];
  if (n === 0) await db.query("delete from leads where id=$1 and workspace_id=$2", [leadId, ws]);
  else
    await db.query(
      `update leads set full_name='[données effacées]', email=null, phone=null, city=null, description=null, answers='{}'::jsonb, ip_hash=null,
          user_agent=null, source_url=null, postal_code=left(postal_code, 2) || '000', dedupe_key='erased:' || id where id=$1 and workspace_id=$2`, [leadId, ws]);
  await audit(db, ws, ACTOR, n === 0 ? "lead.deleted" : "lead.anonymized", "lead", leadId);
  revalidatePath("/prospects");
  redirect("/prospects");
}

/* ─────────── Finances ─────────── */

export async function createExpense(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = expenseInputSchema.safeParse({
    projectId: str(fd.get("projectId")) || null, category: str(fd.get("category")), label: str(fd.get("label")),
    amountCents: parseMoneyToCents(str(fd.get("amount"))) ?? 0, spentOn: str(fd.get("spentOn")),
  });
  if (!parsed.success) return { ok: false, message: "Dépense invalide", errors: issues(parsed.error) };
  const e = parsed.data;
  const db = await getDb();
  const ws = await getWorkspaceId();
  await db.query("insert into expenses (workspace_id, project_id, category, label, amount_cents, spent_on) values ($1,$2,$3,$4,$5,$6)",
    [ws, e.projectId, e.category, e.label, e.amountCents, e.spentOn]);
  await audit(db, ws, ACTOR, "expense.created", "expense", null, { amountCents: e.amountCents });
  revalidatePath("/finances");
  return { ok: true, message: "Dépense ajoutée" };
}

export async function deleteExpense(id: string) {
  const db = await getDb();
  const ws = await getWorkspaceId();
  await db.query("delete from expenses where id=$1 and workspace_id=$2", [id, ws]);
  await audit(db, ws, ACTOR, "expense.deleted", "expense", id);
  revalidatePath("/finances");
}

/* ─────────── Paramètres ─────────── */

export async function purgeDemo() {
  const db = await getDb();
  const ws = await getWorkspaceId();
  await db.tx(async (t) => {
    await t.query("delete from lead_assignments where workspace_id=$1 and is_demo", [ws]);
    await t.query("delete from leads where workspace_id=$1 and is_demo", [ws]);
    await t.query("delete from expenses where workspace_id=$1 and is_demo", [ws]);
    await t.query("delete from partners where workspace_id=$1 and is_demo", [ws]);
    await t.query("delete from projects where workspace_id=$1 and is_demo", [ws]);
    await audit(t, ws, ACTOR, "demo.purged", "workspace", ws);
  });
  revalidatePath("/", "layout");
}

export async function updateWorkspace(fd: FormData) {
  const days = Number(str(fd.get("leadRetentionDays")));
  if (!Number.isInteger(days) || days < 30 || days > 3650) return;
  const db = await getDb();
  const ws = await getWorkspaceId();
  await db.query("update workspaces set lead_retention_days=$2, name=coalesce(nullif($3,''), name) where id=$1", [ws, days, str(fd.get("name")).slice(0, 120)]);
  await audit(db, ws, ACTOR, "workspace.updated", "workspace", ws, { leadRetentionDays: days });
  revalidatePath("/reglages");
}

export async function purgeExpiredLeads() {
  const db = await getDb();
  const ws = await getWorkspaceId();
  const rows = await db.query<{ id: string }>("select id from leads where workspace_id=$1 and retention_until < current_date", [ws]);
  for (const r of rows) {
    await db.query(
      `update leads set full_name='[données effacées]', email=null, phone=null, city=null, description=null, answers='{}'::jsonb, ip_hash=null,
          user_agent=null, source_url=null, postal_code=left(postal_code, 2) || '000', dedupe_key='erased:' || id where id=$1`, [r.id]);
  }
  await audit(db, ws, ACTOR, "retention.purged", "workspace", ws, { count: rows.length });
  revalidatePath("/reglages");
}
