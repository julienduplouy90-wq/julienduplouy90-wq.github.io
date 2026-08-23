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
  // NOTE: adresse personnelle utilisée provisoirement pour que le contact
  // fonctionne dès aujourd'hui. À remplacer par une adresse dédiée
  // (ex. contact@julienduplouy.fr) en changeant uniquement cette ligne.
  contactEmail: "julien.duplouy90@gmail.com",
  // Lien de prise de rendez-vous (Calendly, Cal.com…) : à renseigner
  // quand l'outil sera choisi. Laisser null pour utiliser l'email.
  bookingUrl: null,

  // --- Offre ---
  priceMonthly: "149",
  priceCurrency: "€",

  // --- Domaine ---
  siteUrl: "https://julienduplouy.fr",

  // --- Analytics ---
  // Aucun service externe n'est connecté par défaut (RGPD).
  // Les événements sont poussés dans window.dataLayer ; il suffira
  // de brancher GA4 / Plausible / autre ensuite (voir main.js).
  debugAnalytics: false,
};
