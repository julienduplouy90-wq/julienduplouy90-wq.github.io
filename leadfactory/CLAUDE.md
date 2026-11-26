# CLAUDE.md — LeadFactory

Lire aussi `AGENTS.md` (généré par Next.js 16 : consulter `node_modules/next/dist/docs/` avant d'utiliser une API Next).

## Contexte
Micro-SaaS de génération de prospects locaux. Propriétaire = premier utilisateur. Budget minimal (200 € au lancement),
15–20 h/semaine. Projet pilote : assainissement non collectif en Dordogne (24). Interface et contenus en **français**.

## Règles impératives
- Ne jamais envoyer d'e-mail, publier un site, transmettre un prospect, souscrire un abonnement ou payer sans autorisation explicite.
- Ne pas développer de prospection e-mail (une campagne Gmail existe déjà).
- Contenus des sites : aucun faux avis, fausse certification, fausse adresse, chiffre réglementaire/technique/prix inventé ; transparence sur le rôle d'intermédiaire ; pas de pages géographiques pauvres en masse.
- Aucune vraie donnée personnelle dans les tests, seeds ou commits (`@example.com`, noms « (fictif) », numéros 0500000000/0600000000).
- Qualification et transmission : toujours une validation humaine. Un prospect exclusif = une seule attribution active.
- Toutes les requêtes métier filtrent par `workspace_id`. Les entrées sont validées côté serveur (Zod).
- Commits atomiques, en français. Ne pas modifier le site GitHub Pages à la racine du dépôt (hors `leadfactory/`).

## Stack
Next.js 16 (App Router, `src/proxy.ts` remplace middleware) · React 19 · TypeScript strict · Tailwind 4 · composants UI maison style shadcn
(`src/components/ui`) · Zod 4 · PostgreSQL via PGlite (local) ou postgres.js (Supabase) · Vitest 4 · Playwright 1.63.
`.npmrc` : `legacy-peer-deps=true` (conflit de peer deps optionnelles de vite/vitest).

## Carte du code
- `db/migrations/*.sql` — schéma (appliqué automatiquement). `db/supabase/` — RLS, Supabase uniquement.
- `src/lib/db/` — client (PGlite/Postgres), migrations, amorçage (`seed.ts`).
- `src/lib/domain/` — logique pure testée : qualification, distribution, finance, CSV, contact, schémas Zod, libellés.
- `src/lib/repo/` — lectures SQL (`queries.ts`), enregistrement prospect (`lead-intake.ts`), journal (`audit.ts`).
- `src/lib/actions.ts` — actions serveur du back-office.
- `src/lib/sites/` — modèles de niche (`niches/`), consentement versionné, chargement de site.
- `src/app/(admin)/` — back-office (espaces Leads : leads, prospects, partenaires, finances ; Sites : sites ; reglages). Navigation : `src/components/admin/nav.tsx`. `src/app/s/[site]/` — sites publics. `src/app/api/leads` — collecte publique.

## Vérifications avant commit
`npm run typecheck && npm test` ; `npm run test:e2e` si parcours public ou attribution modifiés.
