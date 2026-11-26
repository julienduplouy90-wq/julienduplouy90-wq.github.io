import type { Metadata } from "next";
import { requireSite } from "@/lib/sites/load";
import { siteMetadata } from "@/lib/sites/meta";
import { Container, Cta, JsonLd } from "@/components/site/ui";

type P = { params: Promise<{ site: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await requireSite((await params).site);
  return siteMetadata(s, "/faq", `Questions fréquentes | ${s.brand}`, `Fonctionnement du service de mise en relation ${s.brand}, données personnelles, SPANC.`);
}

export default async function Faq({ params }: P) {
  const s = await requireSite((await params).site);
  const faq = s.niche.content.faq;
  return (
    <Container className="py-12">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <h1 className="text-3xl font-bold tracking-tight">Questions fréquentes</h1>
      <div className="mt-8 max-w-3xl divide-y divide-slate-200 border-y border-slate-200">
        {faq.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
              <span className="flex justify-between gap-4">{f.q}<span className="text-slate-400 group-open:rotate-45">+</span></span>
            </summary>
            <p className="mt-2 text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="mt-10"><Cta href={s.href("/devis")}>Déposer une demande</Cta></div>
    </Container>
  );
}
