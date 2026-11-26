import type { Db } from "./client";
import { getNiche } from "@/lib/sites/niches";
import { CONSENT_VERSION } from "@/lib/sites/consent";
import { insertLead } from "@/lib/repo/lead-intake";

export const PILOT_SLUG = "assainissement-dordogne";
export const DEMO_SLUG = "demo-assainissement-47";

async function createProjectWithSite(
  db: Db,
  ws: string,
  p: { slug: string; name: string; niche: string; zoneLabel: string; zoneCodes: string[]; status: string; targetPriceCents: number; budgetCents: number; objectives: string | null; isDemo: boolean; siteStatus: string },
) {
  const niche = getNiche(p.niche);
  const [proj] = await db.query<{ id: string }>(
    `insert into projects (workspace_id, slug, name, niche, zone_label, zone_codes, status, target_price_cents, budget_cents, objectives, is_demo, seo, qualification)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb) returning id`,
    [ws, p.slug, p.name, p.niche, p.zoneLabel, p.zoneCodes, p.status, p.targetPriceCents, p.budgetCents, p.objectives, p.isDemo,
      JSON.stringify({ titleSuffix: p.zoneLabel, indexable: false }), JSON.stringify({ qualifyThreshold: 70, rejectThreshold: 40 })],
  );
  const projectId = proj!.id;
  for (const [i, s] of niche.services.entries()) {
    await db.query("insert into services (project_id, slug, name, summary, sort) values ($1,$2,$3,$4,$5)", [projectId, s.slug, s.name, s.summary, i]);
  }
  const [site] = await db.query<{ id: string }>(
    "insert into sites (workspace_id, project_id, slug, status, content) values ($1,$2,$3,$4,$5::jsonb) returning id",
    [ws, projectId, p.slug, p.siteStatus, JSON.stringify({ publisher: {} })],
  );
  return { projectId, siteId: site!.id };
}

/** Données réelles minimales : espace de travail + projet pilote (sans prospect ni partenaire). */
export async function seedBase(db: Db): Promise<string> {
  const [w] = await db.query<{ id: string }>("insert into workspaces (name) values ('Mon espace LeadFactory') returning id");
  const ws = w!.id;
  await createProjectWithSite(db, ws, {
    slug: PILOT_SLUG, name: "Assainissement Dordogne", niche: "assainissement", zoneLabel: "Dordogne (24)", zoneCodes: ["24"],
    status: "active", targetPriceCents: 5000, budgetCents: 0, isDemo: false, siteStatus: "preview",
    objectives: "Valider le modèle : premiers partenaires actifs, premiers prospects qualifiés transmis. Prix de 50 € par prospect exclusif à valider ; 2 prospects offerts par partenaire pour test.",
  });
  return ws;
}

/** Générateur pseudo-aléatoire déterministe (mêmes données de démo à chaque initialisation). */
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

/**
 * Données de DÉMONSTRATION, toutes marquées is_demo = true et rattachées à un projet fictif distinct
 * du pilote. Noms, e-mails (@example.com) et numéros sont fictifs. Purge : Paramètres → Supprimer la démo.
 */
export async function seedDemo(db: Db, ws: string) {
  const { projectId, siteId } = await createProjectWithSite(db, ws, {
    slug: DEMO_SLUG, name: "[Démo] Assainissement Lot-et-Garonne", niche: "assainissement", zoneLabel: "Lot-et-Garonne (47)", zoneCodes: ["47"],
    status: "active", targetPriceCents: 5000, budgetCents: 15000, isDemo: true, siteStatus: "preview",
    objectives: "Projet fictif servant à illustrer le tableau de bord.",
  });
  const niche = getNiche("assainissement");
  const rand = rng(42);
  const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length)]!;

  const partnerDefs = [
    { name: "Alpha Assainissement (fictif)", status: "active", services: niche.services.map((s) => s.slug), cap: 8, price: 5000 },
    { name: "Bêta TP (fictif)", status: "active", services: ["fosse-toutes-eaux", "micro-station", "rehabilitation"], cap: 4, price: 4500 },
    { name: "Gamma Environnement (fictif)", status: "negotiating", services: ["micro-station", "filtre-compact"], cap: 5, price: null },
    { name: "Delta Terrassement (fictif)", status: "contacted", services: [], cap: null, price: null },
    { name: "Epsilon Services (fictif)", status: "refused", services: [], cap: null, price: null },
    { name: "Zêta Réseaux (fictif)", status: "opted_out", services: [], cap: null, price: null },
  ];
  const partnerIds: string[] = [];
  for (const [i, p] of partnerDefs.entries()) {
    const [row] = await db.query<{ id: string }>(
      `insert into partners (workspace_id, company_name, contact_name, email, phone, zone_label, zone_codes, services, accepted_price_cents,
         monthly_capacity, status, source, verified_at, notes, is_demo, opted_out_at)
       values ($1,$2,$3,$4,$5,'Lot-et-Garonne','{47}',$6,$7,$8,$9,'Donnée fictive de démonstration',current_date,$10,true,$11) returning id`,
      [ws, p.name, `Contact Démo ${i + 1}`, `partenaire${i + 1}@example.com`, `050000000${i + 1}`, p.services, p.price, p.cap, p.status,
        "Fiche de démonstration — à supprimer.", p.status === "opted_out" ? new Date().toISOString() : null],
    );
    partnerIds.push(row!.id);
    if (p.status === "active") {
      await db.query("insert into partner_projects (partner_id, project_id, agreed_price_cents, free_leads_granted) values ($1,$2,$3,2)", [row!.id, projectId, p.price]);
    }
    await db.query("insert into partner_interactions (partner_id, occurred_at, channel, summary) values ($1, now() - interval '20 days', 'email', 'Premier contact (démo)')", [row!.id]);
  }

  const now = Date.now();
  const leadIds: { id: string; score: number }[] = [];
  for (let i = 0; i < 28; i++) {
    const daysAgo = Math.floor(rand() * 85);
    const outOfZone = i % 9 === 4;
    const res = await insertLead(db, {
      workspaceId: ws, project: { id: projectId, niche: "assainissement", zoneCodes: ["47"], qualification: { qualifyThreshold: 70, rejectThreshold: 40 } },
      siteId, isDemo: true, actor: "seed-demo", createdAt: new Date(now - daysAgo * 86400000 - i * 3600000),
      data: {
        serviceSlug: rand() < 0.15 ? "other" : pick(niche.services).slug,
        postalCode: outOfZone ? "33000" : `47${String(Math.floor(rand() * 900) + 100)}`,
        city: outOfZone ? "Ville hors zone (démo)" : "Commune démo",
        answers: { housing_type: pick(["main_home", "second_home", "new_build"]), main_rooms: rand() < 0.6 ? 3 + Math.floor(rand() * 4) : null,
          current_install: pick(["old_septic", "all_water_tank", "unknown", "none"]), spanc_diagnosis: pick(["non_compliant", "pending", "none", "unknown"]) },
        timeline: pick(niche.timelines).value,
        fullName: `Client Démo ${String(i + 1).padStart(2, "0")}`,
        email: rand() < 0.8 ? `client${i + 1}@example.com` : "",
        phone: rand() < 0.85 ? `06000000${String(i + 10).slice(-2)}` : "",
        description: rand() < 0.6 ? "Demande fictive de démonstration : remplacement envisagé après contrôle." : "",
        consent: true, consentVersion: CONSENT_VERSION,
      },
    });
    leadIds.push({ id: res.id, score: res.score });
  }

  // Statuts de démonstration : qualification humaine simulée, attributions et facturation.
  const active = partnerIds.slice(0, 2);
  let k = 0;
  for (const l of leadIds) {
    if (l.score < 50) {
      await db.query("update leads set status='rejected', reviewed_at=created_at + interval '1 hour', review_note='Démo : rejet' where id=$1", [l.id]);
      continue;
    }
    k++;
    if (k % 5 === 0) {
      await db.query("update leads set status='qualified', reviewed_at=created_at + interval '1 hour' where id=$1", [l.id]);
      continue;
    }
    if (k % 7 === 0) continue; // reste « nouveau »
    const partnerId = active[k % 2]!;
    const free = k <= 4;
    const status = k % 6 === 0 ? "refused" : k % 3 === 0 ? "accepted" : "sent";
    const billing = free || status === "refused" ? "not_billable" : k % 4 === 0 ? "invoiced" : k % 3 === 0 ? "paid" : "forecast";
    await db.query(
      `insert into lead_assignments (workspace_id, lead_id, partner_id, status, price_cents, is_free, billing_status, validated_at, sent_at, is_demo,
          invoiced_at, paid_at)
       select $1, l.id, $3, $4, $5, $6, $7, l.created_at + interval '2 hours', l.created_at + interval '3 hours', true,
          case when $7 in ('invoiced','paid') then l.created_at + interval '5 days' end,
          case when $7 = 'paid' then l.created_at + interval '20 days' end
       from leads l where l.id = $2`,
      [ws, l.id, partnerId, status, free ? 0 : 5000, free, billing],
    );
    await db.query("update leads set status=$2, reviewed_at=created_at + interval '1 hour' where id=$1",
      [l.id, status === "refused" ? "refused_by_partner" : billing === "paid" || billing === "invoiced" ? "sold" : "sent"]);
  }

  const expenses: [string, string, number, number][] = [
    ["domain", "Nom de domaine (démo)", 1200, 80], ["hosting", "Hébergement (démo)", 0, 60],
    ["ads", "Campagne locale test (démo)", 4000, 45], ["ads", "Campagne locale test 2 (démo)", 3500, 15], ["api", "API géocodage (démo)", 500, 30],
  ];
  for (const [cat, label, cents, daysAgo] of expenses) {
    await db.query("insert into expenses (workspace_id, project_id, category, label, amount_cents, spent_on, is_demo) values ($1,$2,$3,$4,$5, current_date - $6::int, true)",
      [ws, projectId, cat, label, cents, daysAgo]);
  }
}
