import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createDb, migrate, type Db } from "@/lib/db/client";
import { seedBase, seedDemo } from "@/lib/db/seed";

let db: Db;
beforeAll(async () => {
  db = await createDb("memory");
  await migrate(db);
  const ws = await seedBase(db);
  await seedDemo(db, ws);
});
afterAll(async () => db.close());

describe("schéma et amorçage", () => {
  it("applique les migrations de façon idempotente", async () => {
    await migrate(db);
    const rows = await db.query<{ n: number }>("select count(*)::int as n from schema_migrations");
    expect(rows[0]!.n).toBeGreaterThan(0);
  });

  it("crée le projet pilote sans aucune donnée de démonstration", async () => {
    const [p] = await db.query<{ id: string; is_demo: boolean }>("select id, is_demo from projects where slug='assainissement-dordogne'");
    expect(p!.is_demo).toBe(false);
    const [{ n }] = (await db.query<{ n: number }>("select count(*)::int n from leads where project_id=$1", [p!.id])) as [{ n: number }];
    expect(n).toBe(0);
    const services = await db.query("select slug from services where project_id=$1", [p!.id]);
    expect(services).toHaveLength(6);
  });

  it("marque toutes les données de démonstration", async () => {
    const [{ n }] = (await db.query<{ n: number }>("select count(*)::int n from leads where is_demo = false")) as [{ n: number }];
    expect(n).toBe(0);
    const [{ d }] = (await db.query<{ d: number }>("select count(*)::int d from leads where is_demo")) as [{ d: number }];
    expect(d).toBe(28);
  });

  it("empêche la double attribution d'un prospect exclusif", async () => {
    const [a] = await db.query<{ lead_id: string; partner_id: string; workspace_id: string }>(
      "select lead_id, partner_id, workspace_id from lead_assignments where status in ('sent','accepted') limit 1");
    await expect(
      db.query("insert into lead_assignments (workspace_id, lead_id, partner_id) values ($1,$2,$3)", [a!.workspace_id, a!.lead_id, a!.partner_id]),
    ).rejects.toThrow();
  });

  it("détecte les doublons à l'enregistrement", async () => {
    const { insertLead } = await import("@/lib/repo/lead-intake");
    const [p] = await db.query<{ id: string; workspace_id: string }>("select id, workspace_id from projects where slug='assainissement-dordogne'");
    const base = {
      workspaceId: p!.workspace_id, siteId: null,
      project: { id: p!.id, niche: "assainissement", zoneCodes: ["24"], qualification: {} },
      data: { serviceSlug: "micro-station", postalCode: "24000", city: "Test", answers: { housing_type: "main_home", current_install: "old_septic", spanc_diagnosis: "none" },
        timeline: "3_months", fullName: "Personne Test", email: "test@example.com", phone: "0600000099", description: "", consent: true, consentVersion: "v" },
    };
    const first = await insertLead(db, base);
    const second = await insertLead(db, { ...base, data: { ...base.data, phone: "06 00 00 00 99", email: "" } });
    expect(first.duplicateOf).toBeNull();
    expect(second.duplicateOf).toBe(first.id);
    expect(second.score).toBeLessThan(first.score);
  });
});
