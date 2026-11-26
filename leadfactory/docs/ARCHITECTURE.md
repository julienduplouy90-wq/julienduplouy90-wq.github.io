# Architecture

## Vue d'ensemble
Une seule application Next.js (App Router) sert trois surfaces :

```
                       ┌─────────────── src/proxy.ts ───────────────┐
  domaine du site ───► │ SITE_DOMAINS → réécriture vers /s/<slug>   │
  /s/<slug>/…  ──────► │ public                                     │
  /api/leads   ──────► │ public (POST validé)                       │
  tout le reste ─────► │ back-office : HTTP Basic si ADMIN_PASSWORD │
                       └────────────────────────────────────────────┘
        │                         │                          │
  Back-office (admin)     Sites publics (s/[site])     API collecte
  Server Components +     modèle de niche + données    Zod + anti-spam
  Server Actions          projet → pages, SEO, JSON-LD  → lead-intake
        └──────────────┬──────────┴──────────────────────────┘
                 src/lib/domain (logique pure, testée)
                 src/lib/repo  (SQL paramétré, workspace_id)
                 src/lib/db    (interface Db : PGlite | postgres.js)
```

## Choix structurants
- **Monolithe modulaire** : pas de micro-services, pas d'ORM. SQL paramétré dans `src/lib/repo`, logique métier pure dans `src/lib/domain`.
- **Base** : interface `Db` minimale (`query`, `exec`, `tx`). Local : PGlite (PostgreSQL 17 en WebAssembly, persistant). Production : Supabase PostgreSQL via `DATABASE_MODE=postgres` + `DATABASE_URL`. Même SQL partout.
- **Migrations** : fichiers `db/migrations/NNNN_*.sql` appliqués au démarrage et suivis dans `schema_migrations`.
- **Multi-tenant prêt** : `workspace_id` sur chaque table métier, filtrage systématique ; `getWorkspaceId()` renvoie aujourd'hui l'unique espace, demain l'espace de l'utilisateur Supabase Auth.
- **Niches = code, projets = données** : une niche (`src/lib/sites/niches/*.ts`) définit services, questions du formulaire, délais et contenus prudents. Créer un projet (nouvelle zone, nouveau prix) ne demande aucun code ; créer une niche demande un fichier relu (garde-fou éditorial).
- **Formulaire générique** : étapes et schéma Zod sont dérivés de la définition de niche ; les réponses spécifiques sont stockées en JSONB (`leads.answers`).
- **i18n / devises** : `locale`, `country`, `currency` portés par workspace et projet ; montants en centimes ; formatage via `Intl`. Les textes d'interface sont en français (extraction i18n reportée).
- **Sites** : rendus dynamiquement (MVP). Domaine propre via `SITE_DOMAINS` ; `basePath` calculé pour que les liens fonctionnent en prévisualisation comme sur domaine. Indexation impossible tant que le site n'est pas « publié » ET marqué indexable.
- **Pas de JS requis** pour le back-office (formulaires GET/Server Actions) ; seuls le formulaire public, la navigation mobile et les formulaires à retour d'état sont des composants client.

## Ajouter une niche
1. Copier `src/lib/sites/niches/assainissement.ts`, adapter services/questions/délais/contenus (sans données inventées).
2. L'enregistrer dans `src/lib/sites/niches/index.ts`.
3. Créer un projet depuis **Projets → Nouveau projet**.

## Déploiement (non réalisé — nécessite votre accord)
Vercel (ou équivalent Node) + Supabase : appliquer `db/migrations` puis `db/supabase/0002_rls.sql`, définir
`DATABASE_MODE=postgres`, `DATABASE_URL`, `ADMIN_PASSWORD`, `IP_HASH_SALT`, `SITE_DOMAINS`, `PUBLIC_BASE_URL`.
PGlite n'est **pas** adapté au serverless (système de fichiers éphémère).
