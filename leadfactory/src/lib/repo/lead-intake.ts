import type { Db } from "@/lib/db/client";
import { dedupeKey, normalizeEmail, normalizePhoneFR } from "@/lib/domain/contact";
import { scoreLead, type QualificationConfig } from "@/lib/domain/qualification";
import { getNiche } from "@/lib/sites/niches";
import { CONSENT_TEXT } from "@/lib/sites/consent";
import { audit } from "./audit";

export type IntakeProject = { id: string; niche: string; zoneCodes: string[]; qualification: QualificationConfig };

export type IntakeData = {
  serviceSlug: string;
  postalCode: string;
  city: string;
  answers: Record<string, unknown>;
  timeline: string;
  fullName: string;
  email: string;
  phone: string;
  description: string;
  consent: boolean;
  consentVersion: string;
};

const DEDUPE_WINDOW_DAYS = 90;

/** Enregistre un prospect : normalisation, dédoublonnage, score initial, durée de conservation, journal. */
export async function insertLead(
  db: Db,
  args: {
    workspaceId: string;
    project: IntakeProject;
    siteId: string | null;
    data: IntakeData;
    ipHash?: string | null;
    userAgent?: string | null;
    sourceUrl?: string | null;
    isDemo?: boolean;
    createdAt?: Date;
    actor?: string;
  },
): Promise<{ id: string; score: number; duplicateOf: string | null }> {
  const { project, data } = args;
  const niche = getNiche(project.niche);
  const createdAt = args.createdAt ?? new Date();
  const email = normalizeEmail(data.email);
  const phone = normalizePhoneFR(data.phone);
  const key = dedupeKey(phone, email);

  const dup = await db.query<{ id: string }>(
    `select id from leads
      where project_id = $1 and created_at > $2::timestamptz - interval '${DEDUPE_WINDOW_DAYS} days' and created_at <= $2::timestamptz
        and (dedupe_key = $3 or ($4::text is not null and email = $4) or ($5::text is not null and phone = $5))
      order by created_at limit 1`,
    [project.id, createdAt.toISOString(), key, email, phone],
  );
  const duplicateOf = dup[0]?.id ?? null;

  const serviceSlugs = (await db.query<{ slug: string }>("select slug from services where project_id = $1", [project.id])).map((r) => r.slug);
  const timeline = niche.timelines.find((t) => t.value === data.timeline);
  const result = scoreLead(
    {
      fullName: data.fullName,
      email,
      phone,
      postalCode: data.postalCode,
      serviceSlug: data.serviceSlug === "other" ? null : data.serviceSlug,
      description: data.description || null,
      timelineActionable: timeline?.actionable ?? null,
      answers: data.answers,
      requiredAnswerIds: niche.questions.filter((q) => q.required).map((q) => q.id),
      consentTransmission: data.consent,
    },
    { zoneCodes: project.zoneCodes, serviceSlugs, isDuplicate: !!duplicateOf },
    project.qualification,
  );

  const [ws] = await db.query<{ days: number }>("select lead_retention_days as days from workspaces where id = $1", [args.workspaceId]);
  const retention = new Date(createdAt.getTime() + (ws?.days ?? 1095) * 86400000).toISOString().slice(0, 10);

  const [row] = await db.query<{ id: string }>(
    `insert into leads (workspace_id, project_id, site_id, full_name, email, phone, postal_code, city, service_slug, description, timeline,
        answers, consent_transmission, consent_text, consent_version, consent_at, ip_hash, user_agent, source_url, dedupe_key, duplicate_of,
        score, score_details, retention_until, is_demo, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23::jsonb,$24,$25,$16)
     returning id`,
    [
      args.workspaceId, project.id, args.siteId, data.fullName.trim(), email, phone, data.postalCode.trim(), data.city.trim(),
      data.serviceSlug, data.description || null, data.timeline, JSON.stringify(data.answers), data.consent, CONSENT_TEXT,
      data.consentVersion, createdAt.toISOString(), args.ipHash ?? null, args.userAgent?.slice(0, 300) ?? null,
      args.sourceUrl?.slice(0, 500) ?? null, key, duplicateOf, result.score, JSON.stringify(result), retention, args.isDemo ?? false,
    ],
  );
  await audit(db, args.workspaceId, args.actor ?? "public-form", "lead.created", "lead", row!.id, { score: result.score, duplicateOf });
  return { id: row!.id, score: result.score, duplicateOf };
}
