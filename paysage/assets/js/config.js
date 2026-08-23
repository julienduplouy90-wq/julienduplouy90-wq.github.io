/* =============================================================
   Configuration centrale du site.
   Tout le branding est ici : pour renommer la marque plus tard,
   modifier UNIQUEMENT ce fichier (+ les balises <title>/meta des
   pages HTML, signalées par des commentaires TODO-BRAND).
   ============================================================= */

window.SITE_CONFIG = {
  // --- Marque (provisoire : identité personnelle, en attendant
  //     une éventuelle marque dédiée) ---
  brandName: "Julien Duplouy",
  brandTagline: "Système de demandes de devis pour paysagistes",

  // --- Coordonnées ---
  // TODO: créer une adresse email dédiée à l'activité avant mise en ligne
  // (éviter une adresse personnelle sur un site public).
  contactEmail: "contact@julienduplouy.fr",
  // TODO: ajouter un lien de prise de rendez-vous (Calendly, Cal.com…)
  // quand l'outil sera choisi. Laisser null pour utiliser l'email.
  bookingUrl: null,

  // --- Offre ---
  priceMonthly: "149",
  priceCurrency: "€",

  // --- Domaine ---
  // TODO: remplacer par le domaine temporaire Hostinger choisi,
  // puis par le domaine définitif. Utilisé pour les liens absolus
  // éventuels côté JS (les meta/canonical sont dans le HTML).
  siteUrl: "https://julienduplouy.fr",

  // --- Analytics ---
  // Aucun service externe n'est connecté par défaut (RGPD).
  // Les événements sont poussés dans window.dataLayer ; il suffira
  // de brancher GA4 / Plausible / autre ensuite (voir main.js).
  debugAnalytics: false,
};
