import { loadSite } from "@/lib/sites/load";

export async function GET(_req: Request, ctx: { params: Promise<{ site: string }> }) {
  const s = await loadSite((await ctx.params).site);
  if (!s) return new Response("Not found", { status: 404 });
  const paths = ["", "/devis", "/faq", "/contact", ...s.services.map((x) => `/services/${x.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${s.url(p)}</loc></url>`).join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

export const dynamic = "force-dynamic";
