import type { Metadata } from "next";
import { requireSite } from "@/lib/sites/load";
import { siteMetadata } from "@/lib/sites/meta";
import { Container, Cta, Missing } from "@/components/site/ui";

type P = { params: Promise<{ site: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await requireSite((await params).site);
  return siteMetadata(s, "/contact", `Contact | ${s.brand}`, `Contacter ${s.brand}, service de mise en relation.`);
}

export default async function Contact({ params }: P) {
  const s = await requireSite((await params).site);
  return (
    <Container className="max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
      <p className="mt-4 text-slate-600">
        Pour un projet, le plus simple est de déposer une demande : elle sera relue puis, avec votre accord, transmise à une entreprise partenaire.
      </p>
      <div className="mt-6"><Cta href={s.href("/devis")}>Déposer une demande</Cta></div>
      <h2 className="mt-10 text-xl font-semibold">Autres questions, données personnelles</h2>
      <p className="mt-2 text-slate-600">
        Écrivez-nous à : {s.publisher.email ? <a className="text-emerald-800 underline" href={`mailto:${s.publisher.email}`}>{s.publisher.email}</a> : <Missing>adresse e-mail de contact</Missing>}
      </p>
      <p className="mt-2 text-sm text-slate-500">Nous ne sommes pas une entreprise de travaux et ne pouvons pas répondre aux questions techniques sur votre installation.</p>
    </Container>
  );
}
