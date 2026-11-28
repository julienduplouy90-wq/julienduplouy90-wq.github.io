# Exemple fictif : une fiche prospect remplie

Cet exemple montre la forme et la profondeur attendues : des faits courts, chacun avec sa source et sa date, la ligne « Société » contrôlée au registre, un seuil annoncé, un calcul montré, des « à vérifier » et des « non confirmé » quand une source manque. L'hôtel, les personnes et les chiffres sont inventés pour l'exemple : n'en reprends aucun dans une vraie fiche. Les crochets restent à remplir.

---

```markdown
# Fiche prospect : Hôtel X

- **Site** : hotel-x.fr   **Ville** : Annecy   **Métier** : hôtel indépendant 3 étoiles, 45 chambres, salle de séminaire
- **Société** : Hôtel X SAS, SIREN [numéro], créée en 1998, 10 à 19 salariés (source : Annuaire des entreprises, [date]). Le SIREN et l'adresse des mentions légales concordent avec le registre.
- **Source** : Google Maps, recherche « hôtel séminaire Annecy »
- **Fiche faite le** : [date du jour]

## Verdict proposé
**[QUALIFIÉ, À VALIDER]**
Priorité suggérée : **haute**, parce que besoin élevé (il vend ses chambres en direct sur son site), recrutement en cours, décideur joignable (réception et standard publiés, adresse de l'hôtel).

## Tes deux questions (1 minute sur le site)
1. **Le besoin** : le site vend les chambres en direct, mais le bouton « Réserver » ouvre une page d'erreur sur mobile. Tu confirmes ?
2. **Le feeling** : rien de particulier (avis Google et presse locale lus, [date]) ; l'hôtel répond poliment aux avis, critiques comprises. Tu as envie d'y aller ?

## Le filtre en or
| Critère | Verdict | Faits (source, date) |
|---|---|---|
| 1. Besoin | oui | réservation en ligne sur le site, séminaires sur devis (site, [date]) ; une dizaine d'hôtels concurrents en première page sur « hôtel Annecy » (recherche Google, [date]) |
| 2. Potentiel économique | oui | CA confidentiel au registre (Annuaire des entreprises, [date]). CA estimé à environ 1,1 M€ : 45 chambres × 130 € × 365 × 50 % de remplissage (chambres : page L'hôtel ; prix : page Tarifs ; [date]). Estimation. Seuil appliqué : 900 000 €, le seuil du profil (300 000 €) relevé pour un hôtel, à faible marge |
| 3. Problème | oui | bouton « Réserver » en erreur sur mobile (testé, [date]) ; aucun avis client sur le site ; copyright 2019 en pied de page |
| 4. Décideur nommé | oui | [Prénom Nom], directrice générale (page Équipe, [date]) |
| 5. Envie de croissance | oui | offre d'emploi de réceptionniste publiée il y a 10 jours (Indeed, [date]) ; salle de séminaire rénovée annoncée sur la page Facebook de l'hôtel ([date de la publication]) |
| 6. Conscience du web | oui | fiche Google soignée, 4,3 sur 5 pour 380 avis ; Instagram actif, dernière publication cette semaine ([date]) |
| 7. Feeling | à toi | rien de particulier (avis et presse lus) |

## Le décideur
- **[Prénom Nom]**, directrice générale (source : page Équipe du site)
- Téléphone : standard de l'hôtel, 04 [numéro] (site)   Email : [prenom.nom]@hotel-x.fr (à vérifier : format déduit de l'adresse du service séminaires)   LinkedIn : [lien]
- **Second contact** : [Prénom Nom], responsable séminaires (page Séminaires du site)

## Les problèmes relevés (la matière de ton audit)
- Le bouton « Réserver » ouvre une page d'erreur sur mobile → des réservations directes perdues, probablement reprises par les plateformes de réservation, avec leur commission
- Aucun avis client sur le site, alors que la fiche Google en compte 380 bien notés → moins de confiance au moment de réserver
- Pixel Meta installé (code de la page d'accueil), publicités actives à vérifier → si aucune pub ne tourne, les visiteurs qui n'ont pas réservé ne sont jamais relancés
- Ce qui marche, à garder pour l'audit : de belles photos des chambres, des tarifs clairs

## Les angles d'intérêt vrais (la matière de ton approche)
- Recrute un réceptionniste (Indeed, publié il y a 10 jours)
- Salle de séminaire rénovée, annoncée sur Facebook ([date de la publication])

## Ce qui reste à vérifier
- Les publicités Meta actives : bibliothèque publicitaire, [lien], 10 secondes (je n'y ai pas accès depuis cet outil)
- L'email de la directrice : format déduit, à confirmer
- « Trophée de l'accueil 2025 » : vu seulement dans un extrait de recherche, la page ne s'ouvre plus : non confirmé, [lien de la recherche]
```

---

## Le même hôtel, dans le tableau récapitulatif d'une liste

```markdown
| Entreprise | Verdict | Critère d'arrêt | Priorité | En une phrase |
|---|---|---|---|---|
| Hôtel X (Annecy) | QUALIFIÉ, À VALIDER |  | haute | vend en direct, bouton Réserver cassé sur mobile, recrute |
```
