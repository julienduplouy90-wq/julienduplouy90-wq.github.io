# Produit — LeadFactory

## Vision
Un système d'exploitation pour créer, exploiter et rentabiliser des sites de génération de prospects locaux :
niche + zone → site → demandes → qualification → partenaire → revenu. Deux modèles : exploitation de mes propres sites
(vente de prospects qualifiés exclusifs), puis commercialisation en SaaS (Rank & Rent, freelances SEO, agences).

## Analyse du cahier des charges : ce qui est indispensable au MVP
Le seul objectif qui compte à court terme : **vendre les premiers prospects du pilote Dordogne** et mesurer la rentabilité.

| Module | MVP (fait) | Reporté |
|---|---|---|
| A. Dashboard | 12 indicateurs, filtres période/projet/niche, graphique hebdo, dépenses par catégorie | Objectifs vs réalisé, alertes |
| B. Projets | Création/édition sans code, services issus de la niche, seuils de qualification, SEO de base | Duplication de projet, multi-pays réel |
| C. Générateur de sites | 1 modèle (accueil, 6 pages services, devis, FAQ, contact, mentions, confidentialité, sitemap, robots, JSON-LD, canonical) | Pages géographiques, éditeur de contenus, thèmes, publication |
| D. CRM partenaires | Fiche complète, 9 statuts, historique, import CSV, liaison projet, opposition | Relances planifiées, pièces jointes |
| E. Collecte | Formulaire 9 étapes, Zod serveur, pot de miel, délai minimal, limitation de débit, doublons, consentement versionné | Captcha (si spam constaté), SMS de vérification |
| F. Qualification | Score 0–100 en 8 critères pondérables, signaux d'inauthenticité, recommandation, validation humaine obligatoire | IA, appel de contrôle tracé |
| G. Distribution | Classement des partenaires (zone, prestation, statut, capacité, prix, équité), exclusivité garantie en base, transmission manuelle | Portail partenaire, envoi automatique, multi-attribution |
| H. Rentabilité | Prévisionnel / facturé / encaissé, offerts, refusés, dépenses par catégorie, marge par projet | Factures PDF, Stripe, rapprochement bancaire |

## Définitions des indicateurs
- **Reçus** : prospects créés sur la période. **Qualifiés** : statut qualifié ou au-delà (attribué, transmis, vendu, refusé par le partenaire).
- **Transmis** : attributions « transmise » ou « acceptée ». **Vendus** : transmis, non offerts, facturables.
- **Prévisionnel** : attributions actives non offertes et facturables. **Facturé** : facturé + encaissé. **Encaissé** : payé.
- **Marge** = encaissé − dépenses (prévisionnelle = prévisionnel − dépenses).
- **Taux de conversion** = vendus / reçus. **Coût par prospect** = dépenses / reçus.

## Cycle de vie d'un prospect
`nouveau` → (humain) `qualifié` | `rejeté` → `attribué` (attribution validée) → `transmis` (vous l'avez envoyé) →
`vendu` (facturé/encaissé) ou `refusé par le partenaire`. Annuler une attribution remet le prospect à `qualifié`.

## Règles métier
- Prospect **exclusif** : une seule attribution active (index unique partiel en base).
- Les N premiers prospects d'un partenaire sont **offerts** (N = 2 par défaut, réglable par projet).
- Prix appliqué : prix convenu (projet) > prix accepté (partenaire) > prix cible (projet).
- Un formulaire complet n'est jamais présumé authentique : signaux (e-mail jetable, numéro répétitif, lien…) + revue humaine.
- Les sites sont transparents sur leur rôle d'intermédiaire et leur financement ; aucun prix, délai, devis ni donnée réglementaire promis ou inventé.

## Projet pilote
Assainissement Dordogne — zone `24`, 6 services, prix cible 50 € (à valider), 2 prospects offerts par partenaire,
site en prévisualisation. Les informations éditeur (mentions légales) sont à compléter dans **Sites**.
