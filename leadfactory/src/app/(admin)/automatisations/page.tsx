import { FutureModule, PageHeader } from "@/components/ui";

export const metadata = { title: "Automatisations" };

export default function Automations() {
  return (
    <>
      <PageHeader title="Automatisations" description="Modules prévus dans la feuille de route. Aucun n'est actif : rien n'est envoyé ni publié automatiquement." />
      <div className="grid gap-4 md:grid-cols-2">
        <FutureModule title="Étude de marché" items={["Recherche automatisée de niches", "Volumes de recherche", "Concurrence SEO", "Coûts publicitaires"]} />
        <FutureModule title="Acquisition de partenaires" items={["Identification d'entreprises via sources autorisées", "Enrichissement de coordonnées professionnelles", "Prospection encadrée (opt-out, traçabilité)"]} />
        <FutureModule title="SEO et contenus" items={["Contenus SEO assistés par IA (relus avant publication)", "Suivi des positions", "Google Search Console"]} />
        <FutureModule title="Qualification et distribution" items={["Qualification assistée par IA", "Notification partenaire (après validation)", "Portail partenaire"]} />
        <FutureModule title="Monétisation SaaS" items={["Facturation Stripe", "Portefeuille de crédits", "Abonnements", "Multi-utilisateur, marque blanche, domaines personnalisés", "Internationalisation"]} />
        <FutureModule title="Publicité" items={["Intégration Google Ads", "Suivi du coût par prospect par campagne"]} />
      </div>
    </>
  );
}
