import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getNiche } from "./niches";
import type { PublisherInfo } from "./types";

export type SiteData = Awaited<ReturnType<typeof loadSite>>;

/** Chargement mutualisé par requête (React cache). Retourne null si le site n'existe pas. */
export const loadSite = cache(async (slug: string) => {
  const db = await getDb();
  const [row] = await db.query<{ id: string; slug: string; status: string; domain: string | null; content: { publisher?: PublisherInfo; brandName?: string };
    projectId: string; projectName: string; niche: string; zoneLabel: string; projectStatus: string; seo: { indexable?: boolean; metaDescription?: string } }>(
    `select s.id, s.slug, s.status, s.domain, s.content, p.id as "projectId", p.name as "projectName", p.niche, p.zone_label as "zoneLabel",
            p.status as "projectStatus", p.seo
       from sites s join projects p on p.id = s.project_id where s.slug = $1`, [slug]);
  if (!row || row.projectStatus === "archived") return null;
  const services = await db.query<{ slug: string; name: string; summary: string }>("select slug, name, summary from services where project_id = $1 order by sort", [row.projectId]);
  const niche = getNiche(row.niche);
  const h = await headers();
  const host = (h.get("host") ?? "").split(":")[0]!.replace(/^www\./, "");
  const onOwnDomain = (process.env.SITE_DOMAINS ?? "").split(",").some((p) => p.split("=")[0]?.trim().toLowerCase() === host && p.split("=")[1]?.trim() === slug);
  const basePath = onOwnDomain ? "" : `/s/${slug}`;
  const origin = onOwnDomain ? `https://${host}` : (process.env.PUBLIC_BASE_URL ?? "http://localhost:3000");
  return {
    ...row, services, niche, basePath, origin,
    brand: row.content.brandName ?? row.projectName,
    publisher: row.content.publisher ?? {},
    indexable: row.status === "published" && !!row.seo.indexable,
    href: (path = "") => `${basePath}${path}` || "/",
    url: (path = "") => `${origin}${basePath}${path}`,
  };
});

/** Variante qui renvoie une 404 si le site n'existe pas (pages et métadonnées). */
export async function requireSite(slug: string) {
  const s = await loadSite(slug);
  if (!s) notFound();
  return s;
}
