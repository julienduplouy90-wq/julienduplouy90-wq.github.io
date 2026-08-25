# Démo — Système de suivi client (piscinistes)

Maquette interactive à montrer **sur téléphone** en rendez-vous. Entreprise fictive
« Piscines Aqualia », données de démonstration. Un seul fichier, aucune dépendance :
`index.html`.

En ligne (une fois la branche fusionnée) : `https://julienduplouy90-wq.github.io/demo-piscine/`

## Les 4 écrans, dans l'ordre où les montrer

| Écran | Ce qu'il prouve | Ce qu'on dit |
| --- | --- | --- |
| **Aujourd'hui** | Rien n'est oublié, et l'artisan garde la main | « Le matin, vous n'ouvrez qu'un seul écran : ce qui vous attend. Le reste est déjà parti. » |
| **Suivi** | Chaque demande a une trace, message par message | Ouvrir la fiche **M. Lartigue** (onglet Gagnés) : demande → réponse en 40 s → devis → 2 relances → appel → signé 1 560 € → avis Google → hivernage programmé. |
| **Échéances** | Le récurrent est piloté tout seul | « 41 hivernages à caler : les propositions partent trois semaines avant, sans que vous y pensiez. » |
| **Résultats** | L'abonnement se justifie tout seul | « 12 480 € récupérés pour 299 €. » C'est l'écran qui empêche la résiliation. |

## Ce que couvre la démo (les 6 fonctions du MVP)

1. Nouvelle demande → fiche créée + notification immédiate (onglet Suivi)
2. Demande non traitée → rappel à l'artisan (onglet Aujourd'hui, carte bleue)
3. Devis envoyé → relances J+3 / J+7, puis tâche d'appel (fiche M. Bourdette)
4. Prestation terminée → demande d'avis Google (fil « Fait sans vous », fiche M. Lartigue)
5. Client existant → rappel entretien / hivernage / remise en route (onglet Échéances)
6. Tableau demandes → devis → gagnés → CA attribuable (onglet Résultats)

Le **fallback humain** est visible partout : points bleus = le système, points ambrés =
ce qui revient à l'artisan. C'est l'argument qui rassure (« ça ne parle pas à ma place »).

## Adapter à un prospect avant un rendez-vous

Tout est dans les tableaux `actions`, `autoFeed`, `leads`, `deadlines`, `funnel` et
`attrib`, en haut du `<script>` de `index.html`. Remplacer le nom en haut du fichier
(`Piscines Aqualia`), les villes et deux ou trois montants suffit à rendre la démo
crédible pour le prospect en face.
