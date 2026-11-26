---
name: sites-leads-locaux
description: Crée en série des sites de génération de leads locaux (devis travaux/services) en HTML statique géolocalisé — accueil → départements → villes, maillage interne type meilleursagents, formulaire de devis PHP, JSON-LD annuaire d'entreprises — à partir d'un catalogue de 50 niches priorisées. Utiliser quand l'utilisateur veut lancer un ou plusieurs sites de leads, choisir des niches, générer/déployer une flotte de sites, ou ajouter une niche.
---

# Sites de leads locaux — usine à 50 sites

Méthode « SEO local à volume » : beaucoup de sites simples, un par niche, chacun avec des milliers de
pages ville. ~70 % ne rankeront pas ; on garde et on duplique les 30 % qui génèrent des leads.

Tout est dans ce dossier :

| Fichier | Rôle |
|---|---|
| `scripts/niches.json` | Les 50 niches (tier A/B/C, ticket, prix de lead indicatif, saison, acheteurs, précautions, services) |
| `references/niches-50.md` | Pourquoi ces niches, ordre de lancement en 5 vagues, niches écartées |
| `references/methode.md` | Structure de page, maillage, domaines, indexation, monétisation, suivi |
| `references/conformite.md` | Règles non négociables (RGPD, consentement, démarchage, contenus) |
| `scripts/fetch-geo.mjs` | Télécharge communes + départements (geo.api.gouv.fr) → `data/geo-fr.json` (+ départements limitrophes) |
| `scripts/fetch-businesses.mjs` | Annuaire Google Maps par ville via DataForSEO → `data/businesses/<niche>/<insee>.json` |
| `scripts/build-site.mjs` | Génère un site complet (ou toute une flotte) dans `dist/<domaine>/` |
| `scripts/deploy-hostinger.mjs` | Crée le site Hostinger (sous-domaine gratuit si besoin) et déploie `dist/<domaine>/` |
| `sites/*.json` | Flotte déployée (une config par niche) |
| `examples/site-exemple.json` | Modèle de configuration d'un site |

`data/`, `dist/` et `sites/_publisher.json` sont ignorés par Git (données volumineuses, infos éditeur).

## Déroulé

Toutes les commandes se lancent depuis le dossier du skill : `cd .claude/skills/sites-leads-locaux`.

### 1. Choisir les niches
Lire `references/niches-50.md`. Par défaut : vague 1 = les 10 premières niches tier A dans l'ordre du fichier,
en tenant compte de la saison (lancer 2–3 mois **avant** le pic : clim en janvier, poêles en juin…).
Si l'utilisateur hésite, recommander plutôt que lister.

### 2. Données géo (une fois)
```bash
node scripts/fetch-geo.mjs
```
En cas d'erreur réseau, relancer : le script réessaie déjà 5 fois.

### 3. Configurer chaque site — `sites/<niche>.json`
Copier `examples/site-exemple.json`. Champs :
- `domain` (obligatoire), `brand`, `niche` (slug de `niches.json`)
- `minPop` : seuil d'habitants des pages ville (5000 ≈ 2 250 villes ; 2000 ≈ 5 500 ; commencer à 5000)
- `depts` : `["*"]` national, ou `["24","33"]` pour un site régional
- `leadEmail` (notification), `leadWebhook` (optionnel : Google Sheets Apps Script, LeadFactory, Zapier…)
- `consentRecipients` : à qui le lead est transmis — **doit correspondre à la réalité** (ex. revente à 3 artisans)
- `publisher` : nom, forme, SIRET (ou `rna`), adresse, e-mail, directeur de publication, hébergeur.
  **Ne jamais inventer** ces informations : les demander à l'utilisateur. Sans elles, le build refuse
  (sauf `--draft`, qui produit un site `noindex` à ne pas publier).
- optionnels : `hue` (couleur 0–360), `urlKeyword`, `deptCityLinks`, `maxBusinesses`, `retention`, `analyticsSnippet`

### 4. Annuaire d'entreprises (recommandé, « nouvelle méta » JSON-LD)
Si l'utilisateur a un compte DataForSEO, les identifiants passent par `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`
(jamais dans un fichier commité ; en session cloud, utiliser `request_credential` pour `api.dataforseo.com`).
```bash
node scripts/fetch-businesses.mjs --niche pompe-a-chaleur --min-pop 20000 --limit 300
```
Commencer par les grandes villes (coût ≈ quelques dollars par niche ; les fichiers sont mis en cache).
Autres sources (CrazySERP, SEOSpoint, Outscraper) : écrire les mêmes fichiers JSON, format en tête du script.

### 5. Générer
```bash
node scripts/build-site.mjs --site sites/pompe-a-chaleur.json --businesses data/businesses --out dist
node scripts/build-site.mjs --fleet sites/ --businesses data/businesses --out dist   # toute la flotte
```
Le build dure ~1–2 s par site. Vérifier ensuite : une page ville au rendu (Playwright, 390 px et 1280 px),
`php -l dist/<domaine>/lead.php`, et un envoi test du formulaire (`php -S` local) qui doit écrire une ligne CSV.

Chaque site contient : `index.html`, pages départements `/<mot-clé>-<departement>-<code>/`, pages villes
`/<mot-clé>-<ville>-<cp>/`, mentions légales, confidentialité, `merci/`, `404.html`, `lead.php`, `.htaccess`
(HTTPS, sans www, slash final), `robots.txt`, sitemap index.

### 6. Déployer (Hostinger)
L'offre Business de l'utilisateur (commande 1009872677) accepte un nombre de sites illimité selon lui.
```bash
NODE_USE_ENV_PROXY=1 node scripts/deploy-hostinger.mjs --site sites/<niche>.json --out dist   # ou --fleet sites/
```
Le script : sous-domaine gratuit `*.hostingersite.com` si `"domain": "auto"` (écrit dans le JSON), création du site
sur la commande, build (en brouillon `noindex` si l'éditeur est incomplet — voulu sur un domaine provisoire), zip,
envoi TUS, déploiement statique. Jeton : injecté par le proxy en session cloud (d'où `NODE_USE_ENV_PROXY=1`),
sinon `HOSTINGER_API_TOKEN`. Les leads arrivent dans `../leads-private/<domaine>.csv` (hors racine web), + e-mail si
`leadEmail`. **Demander l'accord avant toute mise en ligne ou achat de domaine.**

Infos éditeur communes : `sites/_publisher.json` (non commité). Les `sites/<niche>.json` (domaine, niche) sont commités
pour garder la correspondance niche ↔ domaine.

Passage au vrai domaine : remplacer `domain` dans le JSON, compléter SIRET + e-mail dans `_publisher.json`
(sinon le site reste en `noindex`), relancer le script.

### 7. Après la mise en ligne
Search Console (propriété domaine + sitemap), envoi d'un lead test, puis suivi à J+30/J+60/J+90 selon
`references/methode.md` → « Tri de la flotte ».

## Règles
- Lire `references/conformite.md` avant de modifier les gabarits. En particulier : pas de faux avis, pas de
  prix ni d'aides chiffrés, pas de numéro surtaxé, pas d'usurpation d'un service public ou d'une entreprise listée,
  consentement explicite au destinataire réel du lead.
- Ajouter une niche = ajouter une entrée dans `niches.json` (mêmes champs), rien d'autre.
- Ne pas commiter `sites/*.json` s'ils contiennent des informations personnelles de l'éditeur, ni `data/`, `dist/`, ni des leads.
