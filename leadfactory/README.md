# LeadFactory

Micro-SaaS pour créer, gérer et rentabiliser des sites de génération de prospects locaux.
Premier projet : **Assainissement Dordogne (24)**. Version **MVP 0.1 — usage interne, local uniquement**.

## Démarrage (5 minutes)

Prérequis : Node.js ≥ 20.9.

```bash
cd leadfactory
npm install
cp .env.example .env.local     # facultatif en local
npm run dev                    # http://localhost:3000
```

Aucun service externe n'est requis : la base PostgreSQL est **embarquée** (PGlite) et stockée dans `./.data/pglite`.
Au premier démarrage : migrations, projet pilote réel (sans prospect ni partenaire) et **données de démonstration fictives**
dans un projet séparé « [Démo] Assainissement Lot-et-Garonne » (bannière jaune). Supprimez-les dans **Paramètres → Supprimer la démo**.

| URL | Contenu |
|---|---|
| `/dashboard` | Vue d'ensemble (filtres période / projet / niche) |
| `/prospects`, `/partenaires`, `/distribution`, `/finances` | Back-office |
| `/s/assainissement-dordogne` | Prévisualisation du site pilote (non indexé) |
| `/s/assainissement-dordogne/devis` | Formulaire progressif en 9 étapes |

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm test` | Tests unitaires + intégration base (Vitest, 22 tests) |
| `npm run test:e2e` | Parcours critiques Playwright desktop + mobile (base en mémoire) |
| `npm run typecheck` | TypeScript strict |
| `npm run build` | Build de production |
| `npm run db:reset` | Supprime la base locale (serveur arrêté) |

## Importer vos partenaires

Exportez votre liste (Google Sheets → Fichier → Télécharger → CSV), puis **Partenaires → Importer un CSV**.
Colonnes reconnues : voir l'aide de l'écran d'import. Les fichiers réels ne doivent **jamais** être commités (`imports/` est ignoré par Git).

## Ce que l'outil ne fait pas (volontairement)

Aucun e-mail envoyé, aucun site publié, aucun prospect transmis automatiquement, aucun paiement.
La transmission d'un prospect se fait par vous (fiche à copier), puis « Marquer comme transmis ».

## Documentation

[CLAUDE.md](CLAUDE.md) · [Produit](docs/PRODUCT.md) · [Architecture](docs/ARCHITECTURE.md) · [Base de données](docs/DATABASE.md) ·
[Sécurité & RGPD](docs/SECURITY.md) · [Décisions](docs/DECISIONS.md) · [Roadmap](docs/ROADMAP.md) · [Tâches](TASKS.md)
