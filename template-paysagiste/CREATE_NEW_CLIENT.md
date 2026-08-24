# Créer un nouveau client en moins de 10 minutes

## Prérequis (une seule fois)

Node.js installé (aucune dépendance à télécharger : `npm install` est inutile).

## Méthode rapide — le script

```bash
cd template-paysagiste
npm run create-client
```

Le script pose 5 questions :

| Question | Exemple |
|---|---|
| Nom de l'entreprise | Dupont Paysages |
| Ville principale | Tarbes |
| Téléphone | 05 62 00 00 00 |
| Email | contact@dupont-paysages.fr |
| Couleur principale (hex) | #1e4230 |

Il crée `clients/dupont-paysages/config.json` (en **mode démo**), adapte
les villes et la FAQ, puis construit la maquette dans
`dist/dupont-paysages/`. Ouvrez `dist/dupont-paysages/index.html` : la
maquette de prospection est prête.

## Affiner la maquette (optionnel, ~5 min)

Tout se passe dans **un seul fichier** : `clients/<slug>/config.json`.

- `tagline`, `yearsExperience`, `interventionAreas`
- `services` : supprimer/réordonner selon l'activité réelle du prospect
- `projects` : titres et communes des réalisations d'exemple
- `primaryColor` / `secondaryColor`
- Photos réelles : déposez-les dans `clients/<slug>/img/`, elles sont
  copiées dans `assets/img/client/` au build — référencez-les dans la
  config (`"afterImage": "assets/img/client/jardin-1.jpg"`).

Puis reconstruire :

```bash
npm run build <slug>
```

## Mettre la maquette en ligne pour le prospect

Uploader le **contenu** de `dist/<slug>/` sur un sous-domaine ou un
domaine de démo (Hostinger/o2switch : dossier du site). En mode démo le
site est automatiquement : non indexé (robots.txt en Disallow, meta
noindex), bandeau « Site de démonstration », formulaire sans envoi réel.

## Passage en production après signature

1. Dans `clients/<slug>/config.json` :
   - `demoMode: false`
   - `domain` : le vrai domaine (https://…)
   - `legalName`, bloc `legal` (statut, SIRET, directeur, hébergeur)
   - vraies réalisations (photos dans `clients/<slug>/img/`), vrais
     services, `reviews.mode: "live"` avec les vrais avis,
     `googleBusinessUrl` / `googleReviewUrl`
2. `npm run build <slug>`
3. Sur l'hébergement : copier `api/config.sample.php` → `api/config.php`
   et renseigner `NOTIFY_EMAIL` (le formulaire enverra les demandes par
   email). `SYSTEMEIO_API_KEY` : à renseigner quand l'intégration
   Systeme.io est prête.
4. Uploader le contenu de `dist/<slug>/`.

`api/config.php` contient des identifiants : il n'est jamais commité
(`.gitignore`) et se gère directement sur le serveur.

## Règle d'or de la maintenance

**Ne jamais modifier un fichier dans `dist/`** (écrasé à chaque build) ni
copier-coller un site pour en faire un autre. Une amélioration du
template (`assets/`, `lib/render.js`) profite à tous les clients : il
suffit de relancer `npm run build --all` et de redéployer.
