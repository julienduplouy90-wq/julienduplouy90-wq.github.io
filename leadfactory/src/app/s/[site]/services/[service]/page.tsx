import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSite } from "@/lib/sites/load";
import { siteMetadata } from "@/lib/sites/meta";
import { Container, Cta, JsonLd } from "@/components/site/ui";

type P = { params: Promise<{ site: string; service: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { site, service } = await params;
  const s = await requireSite(site);
  const sv = s.services.find((x) => x.slug === service);
  if (!sv) return {};
  return siteMetadata(s, `/services/${sv.slug}`, `${sv.name} en ${s.zoneLabel} | ${s.brand}`,
    `${sv.name} en ${s.zoneLabel} : déposez votre demande, transmise avec votre accord à une entreprise partenaire de votre secteur.`);
}

export default async function ServicePage({ params }: P) {
  const { site, service } = await params;
  const s = await requireSite(site);
  const sv = s.services.find((x) => x.slug === service);
  if (!sv) notFound();
  return (
    <Container className="py-12">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: s.brand, item: s.url() },
          { "@type": "ListItem", position: 2, name: sv.name, item: s.url(`/services/${sv.slug}`) },
        ],
      }} />
      <nav className="text-sm text-slate-500" aria-label="Fil d'Ariane"><Link href={s.href()} className="hover:underline">Accueil</Link> › {sv.name}</nav>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{sv.name} en {s.zoneLabel}</h1>
      <div className="mt-6 max-w-3xl space-y-4 text-slate-700">
        {s.niche.content.serviceBody(sv.name, s.zoneLabel).map((p) => <p key={p}>{p}</p>)}
      </div>
      <div className="mt-8"><Cta href={s.href(`/devis?service=${sv.slug}`)}>Décrire mon projet</Cta></div>
      <h2 className="mt-14 text-xl font-semibold">Autres types de projets</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {s.services.filter((x) => x.slug !== sv.slug).map((x) => (
          <li key={x.slug}><Link href={s.href(`/services/${x.slug}`)} className="text-emerald-800 hover:underline">{x.name}</Link></li>
        ))}
      </ul>
    </Container>
  );
}
