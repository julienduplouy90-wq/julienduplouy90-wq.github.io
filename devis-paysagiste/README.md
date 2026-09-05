# Devis Paysagiste 🌿

Générateur de devis pour paysagistes — MVP mono-utilisateur (pas d'authentification),
pensé pour être testé en local puis montré en démo.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- SQLite via Prisma (base locale dans `prisma/dev.db`, aucun service externe)
- PDF généré avec `@react-pdf/renderer`

## Lancer le projet en local

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env à la racine du projet avec cette ligne :
#    DATABASE_URL="file:./dev.db"
echo 'DATABASE_URL="file:./dev.db"' > .env

# 3. Créer la base et la remplir avec les prestations types
npx prisma migrate dev

# 4. Démarrer
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## Parcours de démo

1. **Premier lancement** → questionnaire de démarrage : localisation + vos prix
   exacts pour chaque prestation (des fourchettes indicatives France sont affichées).
2. **Créer un devis** → infos client, ajout de lignes de prestations, total HT en
   temps réel, enregistrement.
3. **Mes devis** → liste des devis, détail, changement de statut (brouillon/envoyé).
4. **Télécharger en PDF** depuis le détail d'un devis.
5. **Mes tarifs** → consulter/modifier ses prix, et **Export CSV** (à coller dans un
   Google Sheet de suivi des prix par zone).

## Remettre la base à zéro

```bash
rm prisma/dev.db && npx prisma migrate dev
```
