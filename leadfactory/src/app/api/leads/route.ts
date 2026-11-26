import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { buildLeadSchema } from "@/lib/domain/lead-schema";
import { insertLead } from "@/lib/repo/lead-intake";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { getNiche } from "@/lib/sites/niches";
import { CONSENT_VERSION } from "@/lib/sites/consent";
import type { QualificationConfig } from "@/lib/domain/qualification";

const MIN_FILL_MS = 4000;     // en dessous : remplissage automatisé probable
const MAX_PER_HOUR = 5;       // par IP hachée et par site

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof (body as { siteSlug?: unknown }).siteSlug !== "string") {
    return NextResponse.json({ ok: false, error: "Requête invalide" }, { status: 400 });
  }
  const db = await getDb();
  const [site] = await db.query<{ id: string; workspaceId: string; status: string; projectId: string; niche: string; zoneCodes: string[]; qualification: QualificationConfig; projectStatus: string }>(
    `select s.id, s.workspace_id as "workspaceId", s.status, p.id as "projectId", p.niche, p.zone_codes as "zoneCodes", p.qualification, p.status as "projectStatus"
       from sites s join projects p on p.id = s.project_id where s.slug = $1`, [(body as { siteSlug: string }).siteSlug]);
  if (!site || site.projectStatus === "archived") return NextResponse.json({ ok: false, error: "Site inconnu" }, { status: 404 });

  const ipHash = hashIp(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip"));
  if (!(await checkRateLimit(db, `lead:${site.id}:${ipHash ?? "unknown"}`, MAX_PER_HOUR))) {
    return NextResponse.json({ ok: false, error: "Trop de demandes. Merci de réessayer plus tard." }, { status: 429 });
  }

  const parsed = buildLeadSchema(getNiche(site.niche)).safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]));
    return NextResponse.json({ ok: false, error: "Certaines informations sont manquantes ou invalides.", fields }, { status: 422 });
  }
  const d = parsed.data;
  // Pièges anti-robots : réponse identique à un succès pour ne pas renseigner l'attaquant.
  if (d.website !== "" || Date.now() - d.startedAt < MIN_FILL_MS) return NextResponse.json({ ok: true });
  if (d.consentVersion !== CONSENT_VERSION) return NextResponse.json({ ok: false, error: "Formulaire obsolète, merci de recharger la page." }, { status: 409 });

  await insertLead(db, {
    workspaceId: site.workspaceId, siteId: site.id,
    project: { id: site.projectId, niche: site.niche, zoneCodes: site.zoneCodes, qualification: site.qualification },
    data: { ...d, answers: d.answers as Record<string, unknown> },
    ipHash, userAgent: req.headers.get("user-agent"), sourceUrl: req.headers.get("referer"),
  });
  return NextResponse.json({ ok: true });
}
