import { getDb, getWorkspaceId } from "@/lib/db";
import { computeKpis, kpisByProject, type AssignmentRow, type ExpenseRow, type LeadRow } from "@/lib/domain/finance";
import type { PartnerCandidate } from "@/lib/domain/distribution";
import type { QualificationConfig, QualificationResult } from "@/lib/domain/qualification";
import { periodStart, type Period } from "@/lib/utils";

export type ProjectRow = {
  id: string; slug: string; name: string; niche: string; country: string; currency: string; zoneLabel: string; zoneCodes: string[];
  domain: string | null; status: string; targetPriceCents: number; budgetCents: number; freeLeadsPerPartner: number;
  objectives: string | null; seo: Record<string, unknown>; qualification: QualificationConfig; isDemo: boolean; createdAt: string;
};

const PROJECT_COLS = `id, slug, name, niche, country, currency, zone_label as "zoneLabel", zone_codes as "zoneCodes", domain, status,
  target_price_cents as "targetPriceCents", budget_cents as "budgetCents", free_leads_per_partner as "freeLeadsPerPartner",
  objectives, seo, qualification, is_demo as "isDemo", created_at as "createdAt"`;

export async function listProjects(): Promise<ProjectRow[]> {
  const db = await getDb();
  return db.query<ProjectRow>(`select ${PROJECT_COLS} from projects where workspace_id = $1 order by is_demo, created_at`, [await getWorkspaceId()]);
}

export async function getProject(id: string) {
  const db = await getDb();
  const [p] = await db.query<ProjectRow>(`select ${PROJECT_COLS} from projects where workspace_id = $1 and id = $2`, [await getWorkspaceId(), id]);
  if (!p) return null;
  const services = await db.query<{ id: string; slug: string; name: string; summary: string }>(
    "select id, slug, name, summary from services where project_id = $1 order by sort", [id]);
  const sites = await db.query<{ id: string; slug: string; status: string; domain: string | null }>(
    "select id, slug, status, domain from sites where project_id = $1", [id]);
  const partners = await db.query<{ id: string; companyName: string; status: string; agreedPriceCents: number | null; freeLeadsGranted: number }>(
    `select p.id, p.company_name as "companyName", p.status, pp.agreed_price_cents as "agreedPriceCents", pp.free_leads_granted as "freeLeadsGranted"
       from partner_projects pp join partners p on p.id = pp.partner_id where pp.project_id = $1 and pp.active order by p.company_name`, [id]);
  return { project: p, services, sites, partners };
}

export type Filters = { period: Period; projectId?: string; niche?: string };

async function loadFacts(f: Filters) {
  const db = await getDb();
  const ws = await getWorkspaceId();
  const projects = await listProjects();
  const ids = projects.filter((p) => (!f.projectId || p.id === f.projectId) && (!f.niche || p.niche === f.niche)).map((p) => p.id);
  const start = periodStart(f.period)?.toISOString() ?? null;
  const leads = await db.query<LeadRow & { createdAt: string }>(
    `select status, project_id as "projectId", created_at as "createdAt" from leads
      where workspace_id = $1 and project_id = any($2::uuid[]) and ($3::timestamptz is null or created_at >= $3)`, [ws, ids, start]);
  const assignments = await db.query<AssignmentRow>(
    `select l.project_id as "projectId", a.status, a.price_cents as "priceCents", a.is_free as "isFree", a.billing_status as "billingStatus"
       from lead_assignments a join leads l on l.id = a.lead_id
      where a.workspace_id = $1 and l.project_id = any($2::uuid[]) and ($3::timestamptz is null or a.validated_at >= $3)`, [ws, ids, start]);
  const expenses = await db.query<ExpenseRow>(
    `select project_id as "projectId", category, amount_cents as "amountCents" from expenses
      where workspace_id = $1 and (project_id = any($2::uuid[]) or ($4::boolean and project_id is null)) and ($3::date is null or spent_on >= $3::date)`,
    [ws, ids, start, !f.projectId && !f.niche]);
  return { db, ws, projects, ids, leads, assignments, expenses };
}

export async function loadDashboard(f: Filters) {
  const { db, ws, projects, ids, leads, assignments, expenses } = await loadFacts(f);
  const kpis = computeKpis(leads, assignments, expenses);
  const [counts] = await db.query<{ sitesLive: number; sitesTotal: number; partnersActive: number; partnersTotal: number }>(
    `select (select count(*)::int from sites where workspace_id = $1 and project_id = any($2::uuid[]) and status = 'published') as "sitesLive",
            (select count(*)::int from sites where workspace_id = $1 and project_id = any($2::uuid[])) as "sitesTotal",
            (select count(*)::int from partners where workspace_id = $1 and status = 'active') as "partnersActive",
            (select count(*)::int from partners where workspace_id = $1) as "partnersTotal"`, [ws, ids]);
  // Série hebdomadaire des prospects reçus (12 dernières semaines).
  const weeks: { label: string; received: number; sold: number }[] = [];
  const now = new Date();
  const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  for (let i = 11; i >= 0; i--) {
    const s = new Date(monday.getTime() - i * 7 * 86400000);
    const e = new Date(s.getTime() + 7 * 86400000);
    const inWeek = leads.filter((l) => { const d = new Date(l.createdAt); return d >= s && d < e; });
    weeks.push({ label: s.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), received: inWeek.length, sold: inWeek.filter((l) => l.status === "sold").length });
  }
  const recent = await db.query<{ id: string; fullName: string; postalCode: string; status: string; score: number | null; createdAt: string; projectName: string; isDemo: boolean }>(
    `select l.id, l.full_name as "fullName", l.postal_code as "postalCode", l.status, l.score, l.created_at as "createdAt", p.name as "projectName", l.is_demo as "isDemo"
       from leads l join projects p on p.id = l.project_id where l.workspace_id = $1 and l.project_id = any($2::uuid[]) order by l.created_at desc limit 6`, [ws, ids]);
  const [{ demo }] = (await db.query<{ demo: boolean }>(
    "select exists(select 1 from projects where workspace_id=$1 and is_demo) or exists(select 1 from partners where workspace_id=$1 and is_demo) as demo", [ws])) as [{ demo: boolean }];
  const byProject = kpisByProject(ids, leads, assignments, expenses);
  return {
    kpis, counts: counts!, weeks, recent, hasDemo: demo,
    projects, projectCount: ids.length,
    byProject: projects.filter((p) => ids.includes(p.id)).map((p) => ({ project: p, kpis: byProject[p.id]! })),
  };
}

export async function loadFinances(f: Filters) {
  const { db, ws, projects, ids, leads, assignments, expenses } = await loadFacts(f);
  const start = periodStart(f.period)?.toISOString() ?? null;
  const expenseList = await db.query<{ id: string; label: string; category: string; amountCents: number; spentOn: string; projectName: string | null; isDemo: boolean }>(
    `select e.id, e.label, e.category, e.amount_cents as "amountCents", e.spent_on::text as "spentOn", p.name as "projectName", e.is_demo as "isDemo"
       from expenses e left join projects p on p.id = e.project_id
      where e.workspace_id = $1 and (e.project_id = any($2::uuid[]) or ($4::boolean and e.project_id is null)) and ($3::date is null or e.spent_on >= $3::date)
      order by e.spent_on desc`, [ws, ids, start, !f.projectId && !f.niche]);
  const byProject = kpisByProject(ids, leads, assignments, expenses);
  return {
    kpis: computeKpis(leads, assignments, expenses), expenseList, projects,
    byProject: projects.filter((p) => ids.includes(p.id)).map((p) => ({ project: p, kpis: byProject[p.id]! })),
  };
}

export type LeadListRow = {
  id: string; fullName: string; postalCode: string; city: string | null; serviceSlug: string | null; status: string; score: number | null;
  createdAt: string; projectName: string; projectId: string; isDemo: boolean; duplicateOf: string | null; partnerName: string | null;
};

/** Étapes du parcours d'un prospect, dans l'ordre (onglets de la page Prospects). */
export const LEAD_STEPS = [
  { key: "a-verifier", label: "À vérifier", statuses: ["new"], hint: "Lire la demande, puis qualifier ou rejeter" },
  { key: "a-attribuer", label: "À attribuer", statuses: ["qualified"], hint: "Choisir le partenaire" },
  { key: "a-transmettre", label: "À transmettre", statuses: ["assigned"], hint: "Envoyer la fiche au partenaire" },
  { key: "transmis", label: "Transmis", statuses: ["sent"], hint: "En attente de facturation" },
  { key: "vendus", label: "Vendus", statuses: ["sold"], hint: "Facturés ou encaissés" },
  { key: "ecartes", label: "Écartés", statuses: ["rejected", "refused_by_partner"], hint: "Rejetés ou refusés" },
] as const;

export async function leadStepCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.query<{ status: string; n: number }>(
    "select status, count(*)::int n from leads where workspace_id = $1 group by status", [await getWorkspaceId()]);
  const by = Object.fromEntries(rows.map((r) => [r.status, r.n]));
  return Object.fromEntries(LEAD_STEPS.map((st) => [st.key, st.statuses.reduce((a, x) => a + (by[x] ?? 0), 0)]));
}

/** Facturation à suivre : attributions transmises facturables pas encore encaissées. */
export async function billingQueue() {
  const db = await getDb();
  return db.query<{ id: string; leadId: string; leadName: string; partnerName: string; priceCents: number; billingStatus: string; sentAt: string | null; isDemo: boolean }>(
    `select a.id, a.lead_id as "leadId", l.full_name as "leadName", p.company_name as "partnerName", a.price_cents as "priceCents",
            a.billing_status as "billingStatus", a.sent_at as "sentAt", a.is_demo as "isDemo"
       from lead_assignments a join leads l on l.id = a.lead_id join partners p on p.id = a.partner_id
      where a.workspace_id = $1 and a.status in ('sent','accepted') and not a.is_free and a.billing_status in ('forecast','invoiced')
      order by a.billing_status desc, a.sent_at`, [await getWorkspaceId()]);
}

export async function listLeads(f: { status?: string; statuses?: readonly string[]; projectId?: string; q?: string }) {
  const db = await getDb();
  return db.query<LeadListRow>(
    `select l.id, l.full_name as "fullName", l.postal_code as "postalCode", l.city, l.service_slug as "serviceSlug", l.status, l.score,
            l.created_at as "createdAt", p.name as "projectName", p.id as "projectId", l.is_demo as "isDemo", l.duplicate_of as "duplicateOf",
            (select pa.company_name from lead_assignments a join partners pa on pa.id = a.partner_id
              where a.lead_id = l.id and a.status in ('validated','sent','accepted') limit 1) as "partnerName"
       from leads l join projects p on p.id = l.project_id
      where l.workspace_id = $1 and ($2::text is null or l.status = $2) and ($3::uuid is null or l.project_id = $3)
        and ($4::text is null or l.full_name ilike '%' || $4 || '%' or l.postal_code like $4 || '%' or l.city ilike '%' || $4 || '%')
        and ($5::text[] is null or l.status = any($5::text[]))
      order by l.created_at desc limit 500`,
    [await getWorkspaceId(), f.status || null, f.projectId || null, f.q || null, f.statuses ? [...f.statuses] : null]);
}

export type LeadDetail = {
  id: string; projectId: string; projectName: string; niche: string; status: string; fullName: string; email: string | null; phone: string | null;
  postalCode: string; city: string | null; serviceSlug: string | null; description: string | null; timeline: string | null;
  answers: Record<string, unknown>; consentTransmission: boolean; consentText: string; consentVersion: string; consentAt: string;
  sourceUrl: string | null; duplicateOf: string | null; score: number | null; scoreDetails: QualificationResult | null;
  reviewedAt: string | null; reviewNote: string | null; retentionUntil: string | null; isDemo: boolean; createdAt: string; targetPriceCents: number;
};

export async function getLead(id: string) {
  const db = await getDb();
  const ws = await getWorkspaceId();
  const [lead] = await db.query<LeadDetail>(
    `select l.id, l.project_id as "projectId", p.name as "projectName", p.niche, l.status, l.full_name as "fullName", l.email, l.phone,
            l.postal_code as "postalCode", l.city, l.service_slug as "serviceSlug", l.description, l.timeline, l.answers,
            l.consent_transmission as "consentTransmission", l.consent_text as "consentText", l.consent_version as "consentVersion",
            l.consent_at as "consentAt", l.source_url as "sourceUrl", l.duplicate_of as "duplicateOf", l.score, l.score_details as "scoreDetails",
            l.reviewed_at as "reviewedAt", l.review_note as "reviewNote", l.retention_until::text as "retentionUntil", l.is_demo as "isDemo",
            l.created_at as "createdAt", p.target_price_cents as "targetPriceCents"
       from leads l join projects p on p.id = l.project_id where l.workspace_id = $1 and l.id = $2`, [ws, id]);
  if (!lead) return null;
  const assignments = await db.query<{ id: string; partnerId: string; partnerName: string; status: string; priceCents: number; isFree: boolean; billingStatus: string; validatedAt: string; sentAt: string | null }>(
    `select a.id, a.partner_id as "partnerId", p.company_name as "partnerName", a.status, a.price_cents as "priceCents", a.is_free as "isFree",
            a.billing_status as "billingStatus", a.validated_at as "validatedAt", a.sent_at as "sentAt"
       from lead_assignments a join partners p on p.id = a.partner_id where a.lead_id = $1 order by a.created_at desc`, [id]);
  return { lead, assignments };
}

/** Candidats à l'attribution pour un prospect (données brutes pour rankPartners). */
export async function partnerCandidates(projectId: string): Promise<PartnerCandidate[]> {
  const db = await getDb();
  return db.query<PartnerCandidate>(
    `select p.id, p.company_name as "companyName", p.status, p.zone_codes as "zoneCodes", p.services, p.monthly_capacity as "monthlyCapacity",
            p.accepted_price_cents as "acceptedPriceCents", pp.agreed_price_cents as "agreedPriceCents", (pp.partner_id is not null) as "linkedToProject",
            coalesce(pp.free_leads_granted, pr.free_leads_per_partner) as "freeLeadsGranted",
            (select count(*)::int from lead_assignments a where a.partner_id = p.id and a.status in ('validated','sent','accepted')
               and a.validated_at >= date_trunc('month', now())) as "assignedThisMonth",
            (select count(*)::int from lead_assignments a where a.partner_id = p.id and a.is_free and a.status <> 'cancelled') as "freeLeadsUsed",
            (select count(*)::int from lead_assignments a where a.partner_id = p.id and a.status <> 'cancelled') as "totalAssigned"
       from partners p
       join projects pr on pr.id = $2
       left join partner_projects pp on pp.partner_id = p.id and pp.project_id = $2 and pp.active
      where p.workspace_id = $1`, [await getWorkspaceId(), projectId]);
}

export type PartnerRow = {
  id: string; companyName: string; contactName: string | null; email: string | null; phone: string | null; website: string | null; address: string | null;
  zoneLabel: string | null; zoneCodes: string[]; services: string[]; acceptedPriceCents: number | null; monthlyCapacity: number | null; status: string;
  source: string | null; verifiedAt: string | null; notes: string | null; isDemo: boolean; createdAt: string; assignedCount: number;
};
const PARTNER_COLS = `p.id, p.company_name as "companyName", p.contact_name as "contactName", p.email, p.phone, p.website, p.address, p.zone_label as "zoneLabel",
  p.zone_codes as "zoneCodes", p.services, p.accepted_price_cents as "acceptedPriceCents", p.monthly_capacity as "monthlyCapacity", p.status, p.source,
  p.verified_at::text as "verifiedAt", p.notes, p.is_demo as "isDemo", p.created_at as "createdAt",
  (select count(*)::int from lead_assignments a where a.partner_id = p.id and a.status <> 'cancelled') as "assignedCount"`;

export async function listPartners(f: { status?: string; q?: string }) {
  const db = await getDb();
  return db.query<PartnerRow>(
    `select ${PARTNER_COLS} from partners p where p.workspace_id = $1 and ($2::text is null or p.status = $2)
       and ($3::text is null or p.company_name ilike '%' || $3 || '%' or p.zone_label ilike '%' || $3 || '%')
     order by p.is_demo, p.company_name`, [await getWorkspaceId(), f.status || null, f.q || null]);
}

export async function getPartner(id: string) {
  const db = await getDb();
  const [partner] = await db.query<PartnerRow>(`select ${PARTNER_COLS} from partners p where p.workspace_id = $1 and p.id = $2`, [await getWorkspaceId(), id]);
  if (!partner) return null;
  const interactions = await db.query<{ id: string; occurredAt: string; channel: string; summary: string }>(
    `select id, occurred_at as "occurredAt", channel, summary from partner_interactions where partner_id = $1 order by occurred_at desc`, [id]);
  const projects = await db.query<{ projectId: string; name: string; agreedPriceCents: number | null; freeLeadsGranted: number }>(
    `select pr.id as "projectId", pr.name, pp.agreed_price_cents as "agreedPriceCents", pp.free_leads_granted as "freeLeadsGranted"
       from partner_projects pp join projects pr on pr.id = pp.project_id where pp.partner_id = $1 and pp.active`, [id]);
  const assignments = await db.query<{ id: string; leadId: string; leadName: string; status: string; priceCents: number; isFree: boolean; billingStatus: string; validatedAt: string }>(
    `select a.id, a.lead_id as "leadId", l.full_name as "leadName", a.status, a.price_cents as "priceCents", a.is_free as "isFree",
            a.billing_status as "billingStatus", a.validated_at as "validatedAt"
       from lead_assignments a join leads l on l.id = a.lead_id where a.partner_id = $1 order by a.validated_at desc limit 50`, [id]);
  return { partner, interactions, projects, assignments };
}

export async function loadDistribution() {
  const db = await getDb();
  const ws = await getWorkspaceId();
  const queue = await db.query<LeadListRow>(
    `select l.id, l.full_name as "fullName", l.postal_code as "postalCode", l.city, l.service_slug as "serviceSlug", l.status, l.score,
            l.created_at as "createdAt", p.name as "projectName", p.id as "projectId", l.is_demo as "isDemo", l.duplicate_of as "duplicateOf", null as "partnerName"
       from leads l join projects p on p.id = l.project_id where l.workspace_id = $1 and l.status = 'qualified' order by l.created_at`, [ws]);
  const toSend = await db.query<{ id: string; leadId: string; leadName: string; partnerName: string; priceCents: number; isFree: boolean; validatedAt: string; isDemo: boolean }>(
    `select a.id, a.lead_id as "leadId", l.full_name as "leadName", p.company_name as "partnerName", a.price_cents as "priceCents",
            a.is_free as "isFree", a.validated_at as "validatedAt", a.is_demo as "isDemo"
       from lead_assignments a join leads l on l.id = a.lead_id join partners p on p.id = a.partner_id
      where a.workspace_id = $1 and a.status = 'validated' order by a.validated_at`, [ws]);
  const load = await db.query<{ id: string; companyName: string; monthlyCapacity: number | null; thisMonth: number; isDemo: boolean }>(
    `select p.id, p.company_name as "companyName", p.monthly_capacity as "monthlyCapacity", p.is_demo as "isDemo",
            (select count(*)::int from lead_assignments a where a.partner_id = p.id and a.status in ('validated','sent','accepted')
               and a.validated_at >= date_trunc('month', now())) as "thisMonth"
       from partners p where p.workspace_id = $1 and p.status = 'active' order by p.company_name`, [ws]);
  return { queue, toSend, load };
}

export async function listSites() {
  const db = await getDb();
  return db.query<{ id: string; slug: string; status: string; domain: string | null; template: string; projectId: string; projectName: string; zoneLabel: string; niche: string; isDemo: boolean; publisher: Record<string, string>; leads: number }>(
    `select s.id, s.slug, s.status, s.domain, s.template, p.id as "projectId", p.name as "projectName", p.zone_label as "zoneLabel", p.niche,
            p.is_demo as "isDemo", coalesce(s.content->'publisher', '{}'::jsonb) as publisher,
            (select count(*)::int from leads l where l.site_id = s.id) as leads
       from sites s join projects p on p.id = s.project_id where s.workspace_id = $1 order by p.is_demo, p.created_at`, [await getWorkspaceId()]);
}

export async function getWorkspace() {
  const db = await getDb();
  const [w] = await db.query<{ id: string; name: string; leadRetentionDays: number; defaultCurrency: string; defaultLocale: string }>(
    `select id, name, lead_retention_days as "leadRetentionDays", default_currency as "defaultCurrency", default_locale as "defaultLocale"
       from workspaces where id = $1`, [await getWorkspaceId()]);
  const [c] = await db.query<{ demoProjects: number; demoLeads: number; demoPartners: number; expired: number }>(
    `select (select count(*)::int from projects where workspace_id=$1 and is_demo) as "demoProjects",
            (select count(*)::int from leads where workspace_id=$1 and is_demo) as "demoLeads",
            (select count(*)::int from partners where workspace_id=$1 and is_demo) as "demoPartners",
            (select count(*)::int from leads where workspace_id=$1 and retention_until < current_date) as expired`, [w!.id]);
  const auditRows = await db.query<{ id: number; actor: string; action: string; entity: string; entityId: string | null; createdAt: string }>(
    `select id, actor, action, entity, entity_id as "entityId", created_at as "createdAt" from audit_log where workspace_id = $1 order by id desc limit 30`, [w!.id]);
  return { workspace: w!, counts: c!, audit: auditRows };
}
