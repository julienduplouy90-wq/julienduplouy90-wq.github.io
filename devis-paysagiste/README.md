# Devis Paysagiste 🌿

Générateur de devis pour paysagistes — MVP mono-utilisateur (pas d'authentification),
pensé pour être testé en démo avec de vrais paysagistes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL via Prisma (Neon sur Vercel, ou Postgres local en dev)
- PDF généré avec `@react-pdf/renderer`

## Déployer sur Vercel (recommandé)

1. Sur [vercel.com](https://vercel.com), **Add New → Project** et importer ce
   dépôt GitHub.
2. Dans l'écran d'import, régler **Root Directory** sur `devis-paysagiste`.
3. Avant de déployer : onglet **Storage** du projet → **Create Database** →
   **Neon (Postgres)**, plan gratuit. Vercel ajoute automatiquement la
   variable `DATABASE_URL`.
4. **Deploy**. Le build applique les migrations (`prisma migrate deploy`),
   et la bibliothèque de prix se remplit automatiquement au premier
   chargement de l'app.

À chaque `git push` sur la branche connectée, Vercel redéploie.

## Lancer en local

Il faut une URL PostgreSQL dans `.env` à la racine du projet :

```bash
# Option A : réutiliser la base Neon créée par Vercel
# (Vercel → projet → Storage → Neon → copier DATABASE_URL)
echo 'DATABASE_URL="postgresql://…neon.tech/…"' > .env

# Option B : un Postgres local
echo 'DATABASE_URL="postgresql://user:motdepasse@localhost:5432/devis"' > .env

npm install
npx prisma migrate deploy   # crée les tables
npm run dev                 # → http://localhost:3000
```

## Parcours de démo

1. **Premier lancement** → questionnaire de démarrage : localisation,
   deux questions découverte (logiciel actuel, fourchette publique sur
   leur site), puis vos prix exacts pour chaque prestation (fourchettes
   indicatives France affichées).
2. **Créer un devis** → infos client, lignes de prestations, total HT en
   temps réel, enregistrement.
3. **Mes devis** → liste, détail, statut brouillon/envoyé.
4. **Télécharger en PDF** depuis le détail d'un devis.
5. **Mes tarifs** → consulter/modifier ses prix, et **Export CSV** (à coller
   dans un Google Sheet de suivi des prix par zone).

## Remettre la base à zéro

```bash
npx prisma migrate reset   # vide et recrée les tables (+ seed)
```
