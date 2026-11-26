import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireSite } from "@/lib/sites/load";
import { siteMetadata } from "@/lib/sites/meta";
import { CONSENT_TEXT } from "@/lib/sites/consent";
import { Container, Missing } from "@/components/site/ui";

type P = { params: Promise<{ site: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await requireSite((await params).site);
  return { ...siteMetadata(s, "/confidentialite", `Politique de confidentialité | ${s.brand}`, `Traitement des données personnelles sur ${s.brand}.`), robots: { index: false } };
}

export default async function Privacy({ params }: P) {
  const s = await requireSite((await params).site);
  const db = await getDb();
  const [w] = await db.query<{ days: number }>("select w.lead_retention_days as days from workspaces w join sites s on s.workspace_id = w.id where s.id = $1", [s.id]);
  const years = Math.round(((w?.days ?? 1095) / 365) * 10) / 10;
  const contact = s.publisher.email ?? null;
  return (
    <Container className="max-w-3xl space-y-6 py-12 text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Politique de confidentialité</h1>
      <section><h2 className="font-semibold text-slate-900">Responsable du traitement</h2>
        <p className="mt-1">{s.publisher.name ?? <Missing>nom de l&apos;éditeur</Missing>}, joignable à {contact ?? <Missing>e-mail</Missing>}.</p></section>
      <section><h2 className="font-semibold text-slate-900">Données collectées</h2>
        <p className="mt-1">Uniquement les informations nécessaires au traitement de votre demande : nom, téléphone et/ou e-mail, commune et code postal, caractéristiques du projet
          (type de projet, logement, installation actuelle, diagnostic éventuel, délai, description libre). Votre adresse IP n&apos;est pas conservée en clair : seule une empreinte
          irréversible est utilisée pour limiter les abus.</p></section>
      <section><h2 className="font-semibold text-slate-900">Finalités et base légale</h2>
        <p className="mt-1">Traiter votre demande et, uniquement avec votre consentement explicite, la transmettre à <strong>une seule</strong> entreprise partenaire intervenant
          dans votre secteur afin qu&apos;elle vous recontacte. Le texte de consentement affiché, sa version et sa date sont conservés :</p>
        <blockquote className="mt-2 border-l-2 border-emerald-600 pl-3 text-sm italic">{CONSENT_TEXT}</blockquote></section>
      <section><h2 className="font-semibold text-slate-900">Destinataires</h2>
        <p className="mt-1">L&apos;éditeur du site et, après votre accord, l&apos;entreprise partenaire retenue. Vos données ne sont ni vendues à plusieurs entreprises, ni utilisées pour
          de la publicité.</p></section>
      <section><h2 className="font-semibold text-slate-900">Durée de conservation</h2>
        <p className="mt-1">Environ {years} an(s) à compter de votre demande, puis suppression ou anonymisation.</p></section>
      <section><h2 className="font-semibold text-slate-900">Vos droits</h2>
        <p className="mt-1">Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, d&apos;opposition, de limitation et de portabilité, et pouvez retirer votre
          consentement à tout moment, en écrivant à {contact ?? <Missing>e-mail</Missing>}. Vous pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).</p></section>
      <section><h2 className="font-semibold text-slate-900">Cookies</h2><p className="mt-1">Ce site n&apos;utilise pas de cookies publicitaires ni de mesure d&apos;audience à ce jour.</p></section>
    </Container>
  );
}
