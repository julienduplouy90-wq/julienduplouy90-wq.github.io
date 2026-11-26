import Link from "next/link";
import type { Metadata } from "next";
import { requireSite } from "@/lib/sites/load";
import { siteMetadata } from "@/lib/sites/meta";
import { Container, Cta, JsonLd } from "@/components/site/ui";

type P = { params: Promise<{ site: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await requireSite((await params).site);
  return siteMetadata(s, "", `${s.niche.content.heroTitle(s.zoneLabel)} | ${s.brand}`,
    s.seo.metaDescription ?? `Déposez gratuitement votre demande pour un projet d'assainissement individuel en ${s.zoneLabel}. Mise en relation avec une entreprise partenaire locale.`);
}

export default async function SiteHome({ params }: P) {
  const s = await requireSite((await params).site);
  const c = s.niche.content;
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebSite", name: s.brand, url: s.url(),
        description: `Service de mise en relation pour les projets d'assainissement individuel en ${s.zoneLabel}.`, inLanguage: "fr-FR",
      }} />
      <section className="bg-gradient-to-b from-emerald-50 to-white py-14 sm:py-20">
        <Container>
          <p className="text-sm font-medium text-emerald-800">Service de mise en relation · {s.zoneLabel}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{c.heroTitle(s.zoneLabel)}</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">{c.heroSubtitle(s.zoneLabel)}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Cta href={s.href("/devis")}>Décrire mon projet</Cta>
            <span className="text-sm text-slate-500">Gratuit · sans engagement · environ 2 minutes</span>
          </div>
        </Container>
      </section>

      <section className="py-14" aria-labelledby="how">
        <Container>
          <h2 id="how" className="text-2xl font-semibold">Comment ça marche</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {c.howItWorks.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-slate-200 p-5">
                <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">{i + 1}</span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-slate-50 py-14" aria-labelledby="services">
        <Container>
          <h2 id="services" className="text-2xl font-semibold">Types de projets</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.services.map((sv) => (
              <li key={sv.slug}>
                <Link href={s.href(`/services/${sv.slug}`)} className="block h-full rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-600">
                  <h3 className="font-semibold">{sv.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{sv.summary}</p>
                  <span className="mt-3 inline-block text-sm font-medium text-emerald-800">En savoir plus →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-14" aria-labelledby="zone">
        <Container className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 id="zone" className="text-2xl font-semibold">Zone couverte : {s.zoneLabel}</h2>
            <p className="mt-3 text-slate-600">
              Les demandes sont transmises à une entreprise partenaire intervenant dans le secteur du demandeur. Si aucune entreprise partenaire n&apos;est
              disponible pour votre commune, nous vous en informerons et votre demande ne sera pas transmise.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="font-semibold text-emerald-900">Transparence</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-emerald-950">
              <li>Nous sommes un intermédiaire, pas une entreprise de travaux.</li>
              <li>Votre demande n&apos;est transmise qu&apos;à une seule entreprise, avec votre accord.</li>
              <li>Nous ne promettons ni devis, ni prix, ni délai d&apos;intervention.</li>
              <li>Le service est financé par les entreprises partenaires.</li>
            </ul>
          </div>
        </Container>
      </section>

      <section className="py-6">
        <Container className="rounded-2xl bg-emerald-800 px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-semibold">Un projet d&apos;assainissement en {s.zoneLabel} ?</h2>
          <p className="mx-auto mt-2 max-w-xl text-emerald-100">Décrivez-le en quelques questions. Votre demande est relue avant toute transmission.</p>
          <Link href={s.href("/devis")} className="mt-6 inline-flex h-12 items-center rounded-lg bg-white px-6 font-semibold text-emerald-900 hover:bg-emerald-50">Déposer ma demande</Link>
        </Container>
      </section>
    </>
  );
}
