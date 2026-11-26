import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSite } from "@/lib/sites/load";
import { Container } from "@/components/site/ui";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ site: string }> }) {
  const { site: slug } = await params;
  const s = await loadSite(slug);
  if (!s) notFound();
  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-900 [color-scheme:light]">
      {s.status !== "published" && (
        <div className="bg-slate-900 px-4 py-1.5 text-center text-xs text-white">Prévisualisation interne — site non publié, non indexé</div>
      )}
      <header className="border-b border-slate-200">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href={s.href()} className="font-semibold tracking-tight text-emerald-800">{s.brand}</Link>
          <nav className="flex items-center gap-4 text-sm" aria-label="Navigation du site">
            <Link href={s.href("/faq")} className="hidden text-slate-600 hover:text-slate-900 sm:inline">Questions fréquentes</Link>
            <Link href={s.href("/contact")} className="hidden text-slate-600 hover:text-slate-900 sm:inline">Contact</Link>
            <Link href={s.href("/devis")} className="rounded-md bg-emerald-700 px-3 py-2 font-medium whitespace-nowrap text-white hover:bg-emerald-800"><span className="sm:hidden">Ma demande</span><span className="hidden sm:inline">Déposer une demande</span></Link>
          </nav>
        </Container>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-16 border-t border-slate-200 bg-slate-50 py-10 text-sm text-slate-600">
        <Container className="space-y-4">
          <p className="max-w-3xl">
            <strong className="text-slate-800">{s.brand} est un service de mise en relation.</strong> Nous ne réalisons pas de travaux. Avec votre accord,
            votre demande est transmise à une entreprise partenaire indépendante intervenant en {s.zoneLabel}. Ce service est rémunéré par les entreprises partenaires.
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Liens légaux">
            <Link href={s.href("/mentions-legales")} className="hover:text-slate-900">Mentions légales</Link>
            <Link href={s.href("/confidentialite")} className="hover:text-slate-900">Confidentialité</Link>
            <Link href={s.href("/faq")} className="hover:text-slate-900">FAQ</Link>
            <Link href={s.href("/contact")} className="hover:text-slate-900">Contact</Link>
          </nav>
        </Container>
      </footer>
    </div>
  );
}
