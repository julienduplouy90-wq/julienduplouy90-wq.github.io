import { describe, it, expect } from "vitest";
import { scoreLead, type LeadForScoring } from "@/lib/domain/qualification";
import { rankPartners, type PartnerCandidate } from "@/lib/domain/distribution";
import { computeKpis } from "@/lib/domain/finance";
import { parseCsv, parsePartnersCsv } from "@/lib/domain/csv";
import { isValidPhoneFR, normalizePhoneFR, isPostalCodeInZones, dedupeKey } from "@/lib/domain/contact";
import { parseMoneyToCents } from "@/lib/domain/money";
import { buildLeadSchema } from "@/lib/domain/lead-schema";
import { assainissement } from "@/lib/sites/niches/assainissement";

const goodLead: LeadForScoring = {
  fullName: "Personne Test", email: "test@example.com", phone: "0600000001", postalCode: "24100",
  serviceSlug: "micro-station", description: "Remplacement d'une ancienne fosse après contrôle du SPANC.",
  timelineActionable: "high", answers: { housing_type: "main_home", current_install: "old_septic", spanc_diagnosis: "non_compliant" },
  requiredAnswerIds: ["housing_type", "current_install", "spanc_diagnosis"], consentTransmission: true,
};
const ctx = { zoneCodes: ["24"], serviceSlugs: ["micro-station"], isDuplicate: false };

describe("qualification", () => {
  it("donne 100 à une demande complète, dans la zone, sans doublon", () => {
    const r = scoreLead(goodLead, ctx);
    expect(r.score).toBe(100);
    expect(r.recommendation).toBe("qualify");
  });
  it("bloque hors zone, doublon ou sans consentement", () => {
    expect(scoreLead({ ...goodLead, postalCode: "33000" }, ctx).blockers).toContain("Hors zone géographique");
    expect(scoreLead(goodLead, { ...ctx, isDuplicate: true }).recommendation).toBe("reject");
    expect(scoreLead({ ...goodLead, consentTransmission: false }, ctx).recommendation).toBe("reject");
  });
  it("une demande complète mais suspecte reste en revue humaine", () => {
    const r = scoreLead({ ...goodLead, email: "x@yopmail.com", phone: "0611111111" }, ctx);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.recommendation).toBe("review");
  });
  it("reste borné entre 0 et 100 avec des poids personnalisés", () => {
    const r = scoreLead(goodLead, ctx, { weights: { zone: 80 } });
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
});

const partner = (o: Partial<PartnerCandidate>): PartnerCandidate => ({
  id: "p", companyName: "P", status: "active", zoneCodes: ["24"], services: ["micro-station"], monthlyCapacity: 5,
  acceptedPriceCents: 4000, agreedPriceCents: null, linkedToProject: true, assignedThisMonth: 0, freeLeadsGranted: 2, freeLeadsUsed: 2, totalAssigned: 2, ...o,
});

describe("distribution", () => {
  const lead = { postalCode: "24100", serviceSlug: "micro-station" };
  it("exclut les partenaires inactifs, hors zone, opposés ou à capacité atteinte", () => {
    const r = rankPartners(lead, [
      partner({ id: "a" }), partner({ id: "b", status: "negotiating" }), partner({ id: "c", zoneCodes: ["47"] }),
      partner({ id: "d", status: "opted_out" }), partner({ id: "e", assignedThisMonth: 5 }),
    ], 5000);
    expect(r.filter((x) => x.eligible).map((x) => x.id)).toEqual(["a"]);
    expect(r.find((x) => x.id === "e")!.reasons).toContain("Capacité mensuelle atteinte");
  });
  it("offre les premiers prospects puis applique le prix convenu", () => {
    const [free] = rankPartners(lead, [partner({ freeLeadsUsed: 0 })], 5000);
    expect(free!.isFree).toBe(true);
    const [paid] = rankPartners(lead, [partner({ agreedPriceCents: 5500 })], 5000);
    expect(paid!.priceCents).toBe(5500);
  });
  it("équilibre la charge entre partenaires éligibles", () => {
    const r = rankPartners(lead, [partner({ id: "busy", assignedThisMonth: 3 }), partner({ id: "calm", assignedThisMonth: 1 })], 5000);
    expect(r[0]!.id).toBe("calm");
  });
});

describe("finances", () => {
  it("distingue prévisionnel, facturé et encaissé", () => {
    const k = computeKpis(
      [{ status: "sold", projectId: "x" }, { status: "sent", projectId: "x" }, { status: "new", projectId: "x" }, { status: "rejected", projectId: "x" }],
      [
        { projectId: "x", status: "accepted", priceCents: 5000, isFree: false, billingStatus: "paid" },
        { projectId: "x", status: "sent", priceCents: 5000, isFree: false, billingStatus: "invoiced" },
        { projectId: "x", status: "sent", priceCents: 0, isFree: true, billingStatus: "not_billable" },
        { projectId: "x", status: "refused", priceCents: 5000, isFree: false, billingStatus: "not_billable" },
      ],
      [{ projectId: "x", category: "ads", amountCents: 3000 }],
    );
    expect(k.revenueForecastCents).toBe(10000);
    expect(k.revenueInvoicedCents).toBe(10000);
    expect(k.revenuePaidCents).toBe(5000);
    expect(k.marginCents).toBe(2000);
    expect(k.leadsSold).toBe(2);
    expect(k.leadsFree).toBe(1);
    expect(k.leadsRefused).toBe(1);
    expect(k.conversionRate).toBe(0.5);
    expect(k.costPerLeadCents).toBe(750);
  });
  it("gère l'absence de données", () => {
    const k = computeKpis([], [], []);
    expect(k.conversionRate).toBeNull();
    expect(k.costPerLeadCents).toBeNull();
  });
});

describe("coordonnées", () => {
  it("normalise et valide les téléphones français", () => {
    expect(normalizePhoneFR("+33 6 00 00 00 01")).toBe("0600000001");
    expect(isValidPhoneFR("06.00.00.00.01")).toBe(true);
    expect(isValidPhoneFR("12345")).toBe(false);
  });
  it("vérifie la couverture par préfixe", () => {
    expect(isPostalCodeInZones("24100", ["24"])).toBe(true);
    expect(isPostalCodeInZones("47000", ["24"])).toBe(false);
  });
  it("construit une clé de dédoublonnage stable", () => {
    expect(dedupeKey("06 00 00 00 01", "A@B.fr")).toBe("p:0600000001");
    expect(dedupeKey(null, " A@B.fr ")).toBe("e:a@b.fr");
  });
  it("lit les montants en euros", () => {
    expect(parseMoneyToCents("50")).toBe(5000);
    expect(parseMoneyToCents("49,90 €")).toBe(4990);
    expect(parseMoneyToCents("abc")).toBeNull();
  });
});

describe("import CSV partenaires", () => {
  it("gère guillemets, point-virgule et retours à la ligne", () => {
    expect(parseCsv('a;b\n"x;1";"ligne\nsuite"\n')).toEqual([["a", "b"], ["x;1", "ligne\nsuite"]]);
  });
  it("mappe les en-têtes français et signale les lignes invalides", () => {
    const csv = [
      "Entreprise;Contact;E-mail;Téléphone;Départements;Prix;Statut;Source;Date de vérification",
      "Société Fictive A;Contact A;a@example.com;06 00 00 00 01;24;50;Contacté;Annuaire public;15/11/2026",
      ";Contact B;b@example.com;;24;;;;",
      "Société Fictive C;;pas-un-email;;24;;;;",
    ].join("\n");
    const { rows, errors } = parsePartnersCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ company_name: "Société Fictive A", phone: "0600000001", zone_codes: ["24"], accepted_price_cents: 5000, status: "contacted", verified_at: "2026-11-15" });
    expect(errors.map((e) => e.line)).toEqual([3, 4]);
  });
});

describe("formulaire public", () => {
  const schema = buildLeadSchema(assainissement);
  const valid = {
    siteSlug: "s", serviceSlug: "micro-station", postalCode: "24100", city: "Commune", timeline: "3_months",
    answers: { housing_type: "main_home", main_rooms: null, current_install: "old_septic", spanc_diagnosis: "unknown" },
    fullName: "Personne Test", phone: "0600000001", email: "", description: "", consent: true, consentVersion: "v1", website: "", startedAt: 1,
  };
  it("accepte une demande valide", () => expect(schema.safeParse(valid).success).toBe(true));
  it("exige le consentement, une coordonnée valide et un honeypot vide", () => {
    expect(schema.safeParse({ ...valid, consent: false }).success).toBe(false);
    expect(schema.safeParse({ ...valid, phone: "", email: "" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, website: "spam" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, answers: { ...valid.answers, housing_type: "chateau" } }).success).toBe(false);
  });
});
