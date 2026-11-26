import { loadSite } from "@/lib/sites/load";

/** Tant que le site n'est pas publié ET explicitement indexable, tout est bloqué. */
export async function GET(_req: Request, ctx: { params: Promise<{ site: string }> }) {
  const s = await loadSite((await ctx.params).site);
  if (!s) return new Response("Not found", { status: 404 });
  const body = s.indexable ? `User-agent: *\nAllow: /\nSitemap: ${s.url("/sitemap.xml")}\n` : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export const dynamic = "force-dynamic";
