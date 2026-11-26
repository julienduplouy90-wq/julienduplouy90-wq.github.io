import { NextResponse, type NextRequest } from "next/server";

/** Correspondances domaine → slug de site, ex. SITE_DOMAINS="exemple.fr=assainissement-dordogne". */
function siteForHost(host: string | null): string | null {
  if (!host) return null;
  const h = host.split(":")[0]!.toLowerCase().replace(/^www\./, "");
  for (const pair of (process.env.SITE_DOMAINS ?? "").split(",")) {
    const [domain, slug] = pair.split("=").map((s) => s?.trim().toLowerCase());
    if (domain && slug && domain === h) return slug;
  }
  return null;
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Sites publics servis sur leur propre domaine.
  const site = siteForHost(req.headers.get("host"));
  if (site) {
    if (pathname.startsWith("/api/leads")) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = `/s/${site}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 2. Routes publiques de prévisualisation et de collecte.
  if (pathname.startsWith("/s/") || pathname === "/api/leads") return NextResponse.next();

  // 3. Espace d'administration : HTTP Basic si ADMIN_PASSWORD est défini, obligatoire en production.
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Administration désactivée : définissez ADMIN_PASSWORD.", { status: 503 });
    }
    return NextResponse.next();
  }
  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const pass = decoded.slice(decoded.indexOf(":") + 1);
    if (safeEqual(pass, password)) return NextResponse.next();
  }
  return new NextResponse("Authentification requise", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="LeadFactory", charset="UTF-8"' } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
