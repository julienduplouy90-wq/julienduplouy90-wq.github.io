import { authenticitySignals, isPostalCodeInZones, isValidEmail, isValidPhoneFR } from "./contact";

export type QualificationWeights = {
  contact: number;
  zone: number;
  service: number;
  nature: number;
  timeline: number;
  information: number;
  unique: number;
  consent: number;
};

export const DEFAULT_WEIGHTS: QualificationWeights = {
  contact: 20, zone: 20, service: 15, nature: 10, timeline: 10, information: 10, unique: 10, consent: 5,
};

export type QualificationConfig = {
  weights?: Partial<QualificationWeights>;
  /** Seuil au-dessus duquel la recommandation est « à qualifier ». */
  qualifyThreshold?: number;
  /** Seuil sous lequel la recommandation est « à rejeter ». */
  rejectThreshold?: number;
  /** Nombre minimal de caractères pour une description jugée informative. */
  minDescriptionLength?: number;
};

export type LeadForScoring = {
  fullName: string;
  email: string | null;
  phone: string | null;
  postalCode: string;
  serviceSlug: string | null;
  description: string | null;
  timelineActionable: "high" | "medium" | "low" | null;
  answers: Record<string, unknown>;
  requiredAnswerIds: string[];
  consentTransmission: boolean;
};

export type ScoringContext = { zoneCodes: string[]; serviceSlugs: string[]; isDuplicate: boolean };

export type Check = { key: keyof QualificationWeights; label: string; points: number; max: number; detail: string };

export type QualificationResult = {
  score: number;
  checks: Check[];
  blockers: string[];
  warnings: string[];
  recommendation: "qualify" | "review" | "reject";
};

const filled = (v: unknown) => v !== undefined && v !== null && v !== "" && v !== "unknown";

/**
 * Calcule un score 0–100 et une recommandation. Ne valide JAMAIS automatiquement :
 * la qualification finale reste une décision humaine (voir docs/PRODUCT.md).
 */
export function scoreLead(lead: LeadForScoring, ctx: ScoringContext, config: QualificationConfig = {}): QualificationResult {
  const w = { ...DEFAULT_WEIGHTS, ...config.weights };
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const minDesc = config.minDescriptionLength ?? 20;
  const checks: Check[] = [];
  const blockers: string[] = [];

  const phoneOk = isValidPhoneFR(lead.phone);
  const emailOk = isValidEmail(lead.email);
  const contactPts = phoneOk && emailOk ? w.contact : phoneOk ? Math.round(w.contact * 0.8) : emailOk ? Math.round(w.contact * 0.5) : 0;
  checks.push({ key: "contact", label: "Coordonnées valides", points: contactPts, max: w.contact,
    detail: phoneOk && emailOk ? "Téléphone et e-mail valides" : phoneOk ? "Téléphone valide, e-mail absent ou invalide" : emailOk ? "E-mail seul" : "Aucune coordonnée valide" });
  if (!phoneOk && !emailOk) blockers.push("Aucune coordonnée valide");

  const inZone = isPostalCodeInZones(lead.postalCode, ctx.zoneCodes);
  checks.push({ key: "zone", label: "Zone couverte", points: inZone ? w.zone : 0, max: w.zone,
    detail: inZone ? `Code postal ${lead.postalCode} dans la zone` : `Code postal ${lead.postalCode} hors zone (${ctx.zoneCodes.join(", ")})` });
  if (!inZone) blockers.push("Hors zone géographique");

  const serviceOk = !!lead.serviceSlug && ctx.serviceSlugs.includes(lead.serviceSlug);
  checks.push({ key: "service", label: "Correspondance avec les prestations", points: serviceOk ? w.service : Math.round(w.service * 0.3), max: w.service,
    detail: serviceOk ? "Prestation proposée" : "Type de projet non précisé" });

  const req = lead.requiredAnswerIds;
  const answered = req.filter((id) => filled(lead.answers[id])).length;
  const naturePts = req.length ? Math.round((w.nature * answered) / req.length) : w.nature;
  checks.push({ key: "nature", label: "Nature du projet", points: naturePts, max: w.nature, detail: `${answered}/${req.length} réponses précises` });

  const tl = lead.timelineActionable;
  const tlPts = tl === "high" ? w.timeline : tl === "medium" ? Math.round(w.timeline * 0.6) : tl === "low" ? Math.round(w.timeline * 0.2) : 0;
  checks.push({ key: "timeline", label: "Délai", points: tlPts, max: w.timeline,
    detail: tl === "high" ? "Projet à court terme" : tl === "medium" ? "Projet à moyen terme" : "Projet lointain ou indéterminé" });

  const descLen = (lead.description ?? "").trim().length;
  const infoPts = descLen >= minDesc ? w.information : descLen > 0 ? Math.round(w.information * 0.4) : 0;
  checks.push({ key: "information", label: "Informations suffisantes", points: infoPts, max: w.information,
    detail: descLen >= minDesc ? "Description détaillée" : descLen > 0 ? "Description courte" : "Pas de description" });

  checks.push({ key: "unique", label: "Absence de doublon", points: ctx.isDuplicate ? 0 : w.unique, max: w.unique,
    detail: ctx.isDuplicate ? "Demande similaire récente déjà reçue" : "Aucun doublon détecté" });
  if (ctx.isDuplicate) blockers.push("Doublon");

  checks.push({ key: "consent", label: "Autorisation de transmission", points: lead.consentTransmission ? w.consent : 0, max: w.consent,
    detail: lead.consentTransmission ? "Accord explicite recueilli" : "Pas d'accord de transmission" });
  if (!lead.consentTransmission) blockers.push("Pas d'autorisation de transmission");

  const raw = checks.reduce((a, c) => a + c.points, 0);
  const score = Math.max(0, Math.min(100, Math.round((raw * 100) / total)));
  const warnings = authenticitySignals(lead);

  const qualifyAt = config.qualifyThreshold ?? 70;
  const rejectBelow = config.rejectThreshold ?? 40;
  const recommendation: QualificationResult["recommendation"] =
    blockers.length > 0 || score < rejectBelow ? "reject" : score >= qualifyAt && warnings.length === 0 ? "qualify" : "review";

  return { score, checks, blockers, warnings, recommendation };
}
