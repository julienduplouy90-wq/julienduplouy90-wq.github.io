# Mise en ligne sur Hostinger (sans nom de domaine)

Prérequis : une offre Hostinger compatible **Node.js** (Business, Cloud ou supérieure). Les offres « Premium »/« Single » n'exécutent que PHP.

## 1. Déposer l'application
1. hPanel → **Sites web → Ajouter un site web → Application web Node.js**.
2. Choisir **Importer des fichiers** (archive) et envoyer `leadfactory-hostinger.zip`.
3. Paramètres de build (normalement détectés) :
   - Framework / type d'application : **Next.js**
   - Version de Node : **22**
   - Commande de build : `npm run build` · Gestionnaire : **npm**
4. **Variables d'environnement** → « Importer depuis un fichier .env » → `leadfactory-hostinger.env`
   (contient `ADMIN_PASSWORD`, `IP_HASH_SALT`, `DATABASE_MODE=local`, `SEED_DEMO=false`).
5. Déployer. Hostinger attribue un **domaine temporaire** (visible dans le tableau de bord du site).

## 2. Utiliser
- Back-office : `https://<domaine-temporaire>/` → identifiant quelconque, mot de passe = `ADMIN_PASSWORD`.
- Site pilote : `https://<domaine-temporaire>/s/assainissement-dordogne` (non indexé : `robots.txt` bloque tout tant que le site n'est pas publié).

## 3. Données
- Base PostgreSQL embarquée, stockée dans `~/leadfactory-data/pglite` (hors du dossier de l'application : survit aux redéploiements).
- Démarrage **à zéro** : seul le projet pilote « Assainissement Dordogne » existe, sans prospect ni partenaire.
- Sauvegarde : télécharger le dossier `~/leadfactory-data` via le gestionnaire de fichiers.
- Si l'hébergeur ne permet pas l'écriture dans le dossier personnel, définir `PGLITE_DIR` vers un dossier accessible en écriture.

## Limites (pilote)
Une seule instance (PGlite n'accepte qu'un processus). Pour plusieurs utilisateurs ou plus de trafic : passer sur Supabase
(`DATABASE_MODE=postgres`, voir `ARCHITECTURE.md`).

## Déploiement actuel (2026-11-26)
- Site Hostinger : `novel-aqua-gaur-08.hostingersite.com` (sous-domaine gratuit, offre Business, compte `u241978786`).
- Déployé via l'API Hostinger (`developers.hostinger.com`) : site créé par `POST /api/hosting/v1/orders/{order}/onboardings`,
  archive `git archive` téléversée en TUS (`files/upload-urls`), puis `nodejs/builds` (Node 22, app_type `next`, source `archive`).
- Le build utilise **webpack** (`next build --webpack`) : Turbopack échoue dans l'environnement de build Hostinger.
- Variables : `ADMIN_PASSWORD`, `IP_HASH_SALT`, `DATABASE_MODE=local`, `SEED_DEMO=false`, `PUBLIC_BASE_URL`.
