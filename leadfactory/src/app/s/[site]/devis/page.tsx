import type { Metadata } from "next";
import { requireSite } from "@/lib/sites/load";
import { siteMetadata } from "@/lib/sites/meta";
import { CONSENT_TEXT, CONSENT_VERSION } from "@/lib/sites/consent";
import { LeadForm } from "@/components/site/lead-form";
import { Container } from "@/components/site/ui";

type P = { params: Promise<{ site: string }>; searchParams: Promise<{ service?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await requireSite((await params).site);
  return siteMetadata(s, "/devis", `Déposer une demande | ${s.brand}`, `Décrivez votre projet d'assainissement individuel en ${s.zoneLabel} : demande gratuite et sans engagement.`);
}

export default async function Devis({ params, searchParams }: P) {
  const s = await requireSite((await params).site);
  const { service } = await searchParams;
  return (
    <Container className="max-w-3xl py-10">
      <h1 className="text-3xl font-bold tracking-tight">Décrire mon projet</h1>
      <p className="mt-2 text-slate-600">Gratuit et sans engagement. Une entreprise partenaire de votre secteur pourra vous recontacter, avec votre accord.</p>
      <div className="mt-8">
        <LeadForm siteSlug={s.slug} zoneLabel={s.zoneLabel} services={s.services} otherServiceLabel={s.niche.otherServiceLabel}
          questions={s.niche.questions} timelines={s.niche.timelines} consentText={CONSENT_TEXT} consentVersion={CONSENT_VERSION}
          privacyHref={s.href("/confidentialite")} initialService={service} />
      </div>
    </Container>
  );
}
