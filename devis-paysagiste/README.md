# Paysage Digital 🌿

SaaS B2B pour entreprises de paysage : un **simulateur d'estimation** que le
paysagiste intègre sur son propre site. Le visiteur décrit son projet, obtient
une **fourchette indicative** calculée avec les tarifs du paysagiste, puis
laisse ses coordonnées → le paysagiste reçoit un **prospect qualifié**.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL via Prisma (Neon sur Vercel, ou Postgres local en dev)
- Moteur d'estimation **déterministe** (aucune IA dans le calcul des prix) :
  `quantité × fourchette de base × coefficients`, règles configurées par
  chaque entreprise.

## Architecture

```
lib/catalogue.ts   Types de projets, questions, règles par défaut (extensible)
lib/moteur.ts      Moteur d'estimation pur + qualification des leads
app/               Landing (/) · Onboarding (/onboarding)
app/e/[slug]/      Dashboard entreprise : vue d'ensemble, prospects,
                   prestations & prix, installer, réglages
app/s/[slug]/      Simulateur public white-label (intégrable en iframe)
```

Modèles : `Entreprise` → `EntreprisePrestation` (règles tarifaires JSON) →
`Simulation` → `Lead`. Pas d'authentification en phase de validation : le
dashboard de chaque entreprise est accessible par son lien `/e/<slug>`.

## Lancer en local

```bash
echo 'DATABASE_URL="postgresql://user:motdepasse@localhost:5432/simulateur"' > .env
npm install
npx prisma migrate deploy
npm run dev   # → http://localhost:3000
```

## Déployer sur Vercel

1. Importer le dépôt, **Root Directory** = `devis-paysagiste`.
2. Onglet **Storage** → créer une base **Neon (Postgres)** (ajoute `DATABASE_URL`).
3. Deploy — le build applique les migrations automatiquement.

## Parcours de test

1. `/` → « Créer mon simulateur » → onboarding en 4 étapes (< 10 min).
2. Page **Installer** : lien public, code iframe, instructions par plateforme.
3. Ouvrir `/s/<slug>` : simulation complète → fourchette → coordonnées.
4. Dashboard `/e/<slug>` : stats + fiche prospect qualifiée.
