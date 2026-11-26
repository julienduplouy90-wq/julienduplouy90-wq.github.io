export type LeadRow = { status: string; projectId: string };
export type AssignmentRow = { projectId: string; status: string; priceCents: number; isFree: boolean; billingStatus: string };
export type ExpenseRow = { projectId: string | null; category: string; amountCents: number };

const LIVE = new Set(["validated", "sent", "accepted"]);
const TRANSMITTED = new Set(["sent", "accepted"]);
const QUALIFIED_LEAD = new Set(["qualified", "assigned", "sent", "sold", "refused_by_partner"]);

export type Kpis = {
  leadsReceived: number;
  leadsQualified: number;
  leadsSent: number;
  leadsSold: number;
  leadsFree: number;
  leadsRefused: number;
  revenueForecastCents: number;
  revenueInvoicedCents: number;
  revenuePaidCents: number;
  expensesCents: number;
  marginCents: number;
  marginForecastCents: number;
  /** Prospects vendus / prospects reçus (null si aucun prospect). */
  conversionRate: number | null;
  /** Dépenses / prospects reçus (null si aucun prospect). */
  costPerLeadCents: number | null;
  expensesByCategory: Record<string, number>;
};

/**
 * Définitions (docs/PRODUCT.md) :
 * - prévisionnel : attributions vivantes non gratuites et facturables ;
 * - facturé : billing_status invoiced ou paid ; encaissé : paid ;
 * - marge = encaissé − dépenses ; marge prévisionnelle = prévisionnel − dépenses.
 */
export function computeKpis(leads: LeadRow[], assignments: AssignmentRow[], expenses: ExpenseRow[]): Kpis {
  const billable = (a: AssignmentRow) => !a.isFree && a.billingStatus !== "not_billable";
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const forecast = sum(assignments.filter((a) => LIVE.has(a.status) && billable(a)).map((a) => a.priceCents));
  const invoiced = sum(assignments.filter((a) => a.billingStatus === "invoiced" || a.billingStatus === "paid").map((a) => a.priceCents));
  const paid = sum(assignments.filter((a) => a.billingStatus === "paid").map((a) => a.priceCents));
  const expensesCents = sum(expenses.map((e) => e.amountCents));
  const sold = assignments.filter((a) => TRANSMITTED.has(a.status) && billable(a)).length;
  const byCat: Record<string, number> = {};
  for (const e of expenses) byCat[e.category] = (byCat[e.category] ?? 0) + e.amountCents;
  return {
    leadsReceived: leads.length,
    leadsQualified: leads.filter((l) => QUALIFIED_LEAD.has(l.status)).length,
    leadsSent: assignments.filter((a) => TRANSMITTED.has(a.status)).length,
    leadsSold: sold,
    leadsFree: assignments.filter((a) => a.isFree && a.status !== "cancelled").length,
    leadsRefused: assignments.filter((a) => a.status === "refused").length,
    revenueForecastCents: forecast,
    revenueInvoicedCents: invoiced,
    revenuePaidCents: paid,
    expensesCents,
    marginCents: paid - expensesCents,
    marginForecastCents: forecast - expensesCents,
    conversionRate: leads.length ? sold / leads.length : null,
    costPerLeadCents: leads.length ? Math.round(expensesCents / leads.length) : null,
    expensesByCategory: byCat,
  };
}

export function kpisByProject(projectIds: string[], leads: LeadRow[], assignments: AssignmentRow[], expenses: ExpenseRow[]) {
  return Object.fromEntries(
    projectIds.map((id) => [
      id,
      computeKpis(leads.filter((l) => l.projectId === id), assignments.filter((a) => a.projectId === id), expenses.filter((e) => e.projectId === id)),
    ]),
  ) as Record<string, Kpis>;
}
