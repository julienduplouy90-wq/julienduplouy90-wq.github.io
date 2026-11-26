import { isPostalCodeInZones } from "./contact";

export type PartnerCandidate = {
  id: string;
  companyName: string;
  status: string;
  zoneCodes: string[];
  services: string[];
  monthlyCapacity: number | null;
  acceptedPriceCents: number | null;
  /** Prix convenu pour ce projet (partner_projects), prioritaire. */
  agreedPriceCents: number | null;
  linkedToProject: boolean;
  assignedThisMonth: number;
  freeLeadsGranted: number;
  freeLeadsUsed: number;
  totalAssigned: number;
};

export type LeadForDistribution = { postalCode: string; serviceSlug: string | null };

export type Ranked = PartnerCandidate & { eligible: boolean; reasons: string[]; priceCents: number; isFree: boolean; capacityLeft: number | null };

/** Prix applicable : prospect offert tant que le quota gratuit n'est pas consommé, sinon prix convenu > accepté > cible. */
export function priceFor(p: PartnerCandidate, targetPriceCents: number): { priceCents: number; isFree: boolean } {
  if (p.freeLeadsUsed < p.freeLeadsGranted) return { priceCents: 0, isFree: true };
  return { priceCents: p.agreedPriceCents ?? p.acceptedPriceCents ?? targetPriceCents, isFree: false };
}

/**
 * Classe les partenaires pour un prospect. Ne crée aucune attribution : la décision reste manuelle.
 * Tri des éligibles : partenaires liés au projet, puis charge du mois la plus faible (équité), puis prix.
 */
export function rankPartners(lead: LeadForDistribution, partners: PartnerCandidate[], targetPriceCents: number): Ranked[] {
  const ranked = partners.map((p): Ranked => {
    const reasons: string[] = [];
    if (p.status === "opted_out") reasons.push("Opposition à la prospection");
    else if (p.status !== "active") reasons.push("Partenaire non actif");
    if (!isPostalCodeInZones(lead.postalCode, p.zoneCodes)) reasons.push("Hors zone d'intervention");
    if (lead.serviceSlug && p.services.length > 0 && !p.services.includes(lead.serviceSlug)) reasons.push("Prestation non proposée");
    if (p.services.length === 0) reasons.push("Prestations non renseignées");
    const capacityLeft = p.monthlyCapacity === null ? null : Math.max(0, p.monthlyCapacity - p.assignedThisMonth);
    if (capacityLeft === 0) reasons.push("Capacité mensuelle atteinte");
    const { priceCents, isFree } = priceFor(p, targetPriceCents);
    return { ...p, eligible: reasons.length === 0, reasons, priceCents, isFree, capacityLeft };
  });
  return ranked.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    if (a.linkedToProject !== b.linkedToProject) return a.linkedToProject ? -1 : 1;
    if (a.assignedThisMonth !== b.assignedThisMonth) return a.assignedThisMonth - b.assignedThisMonth;
    return b.priceCents - a.priceCents;
  });
}
