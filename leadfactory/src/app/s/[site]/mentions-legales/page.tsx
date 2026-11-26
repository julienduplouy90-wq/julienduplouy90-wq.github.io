import type { Metadata } from "next";
import { requireSite } from "@/lib/sites/load";
import { siteMetadata } from "@/lib/sites/meta";
import { Container, Missing } from "@/components/site/ui";

type P = { params: Promise<{ site: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await requireSite((await params).site);
  return { ...siteMetadata(s, "/mentions-legales", `Mentions légales | ${s.brand}`, `Mentions légales du site ${s.brand}.`), robots: { index: false } };
}

export default async function Legal({ params }: P) {
  const s = await requireSite((await params).site);
  const p = s.publisher;
  const v = (x: string | undefined, label: string) => x ?? <Missing>{label}</Missing>;
  return (
    <Container className="max-w-3xl space-y-6 py-12 text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mentions légales</h1>
      <section><h2 className="font-semibold text-slate-900">Éditeur du site</h2>
        <p className="mt-1">{v(p.name, "nom ou raison sociale")} — {v(p.legalForm, "forme juridique")}<br />SIRET : {v(p.siret, "SIRET")}<br />
          Adresse : {v(p.address, "adresse")}<br />Contact : {v(p.email, "e-mail")}<br />Directeur de la publication : {v(p.director, "directeur de la publication")}</p>
      </section>
      <section><h2 className="font-semibold text-slate-900">Hébergement</h2><p className="mt-1">{v(p.host, "hébergeur : nom, adresse, téléphone")}</p></section>
      <section><h2 className="font-semibold text-slate-900">Activité</h2>
        <p className="mt-1">Ce site est un service de mise en relation entre des particuliers ayant un projet et des entreprises partenaires indépendantes. L&apos;éditeur ne réalise
          aucune prestation de travaux et n&apos;est pas partie aux contrats conclus entre les particuliers et les entreprises. L&apos;éditeur est rémunéré par les entreprises partenaires.</p>
      </section>
      <section><h2 className="font-semibold text-slate-900">Propriété intellectuelle</h2><p className="mt-1">Les contenus de ce site sont protégés. Toute reproduction sans autorisation est interdite.</p></section>
    </Container>
  );
}
