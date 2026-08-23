# Système commercial pour paysagistes — site vitrine

Landing page du service d'abonnement (149 €/mois) destiné aux entreprises
françaises de création et d'aménagement extérieur.

## Stack

HTML / CSS / JS statique, **zéro dépendance, zéro build**. Ouvrir
`index.html` suffit ; n'importe quel hébergement statique (Hostinger,
GitHub Pages…) fonctionne tel quel.

## Structure

```
paysage/
├── index.html              Landing page complète
├── mentions-legales.html   À compléter (TODO visibles)
├── confidentialite.html    À compléter (TODO visibles)
├── favicon.svg
├── robots.txt              TODO : domaine
├── sitemap.xml             TODO : domaine
└── assets/
    ├── css/styles.css
    └── js/
        ├── config.js       ← BRANDING CENTRALISÉ (nom, email, prix…)
        └── main.js         Démo interactive, analytics, animations
```

## Déploiement sur Hostinger

1. Dans hPanel, créer le site sur le domaine temporaire choisi.
2. Uploader **le contenu du dossier `paysage/`** (pas le dossier lui-même)
   à la racine du site (`public_html/`).
3. Mettre à jour le domaine dans : `robots.txt`, `sitemap.xml`,
   `index.html` (balises `canonical` et `og:url`), `assets/js/config.js`.

## Changer de marque plus tard

- `assets/js/config.js` : nom, tagline, email, lien de rendez-vous, prix.
- Les balises `<title>`/meta des pages HTML (repérées par des commentaires
  `TODO-BRAND`).
- `favicon.svg`.

## Analytics

Aucun service connecté (RGPD). Tous les événements sont poussés dans
`window.dataLayer` : `cta_hero`, `cta_hero_demo`, `cta_header`,
`demo_start`, `demo_complete`, `cta_pricing`, `cta_booking`,
`cta_contact`, `scroll_75`. Brancher GA4 (compatible dataLayer) ou
Plausible ensuite — voir commentaires dans `main.js`.

## Démonstration

Le formulaire de devis et le tableau de suivi sont des démonstrations :
**rien n'est envoyé ni enregistré** (photos prévisualisées via FileReader,
côté navigateur uniquement). Un backend pourra être branché plus tard.
