# Photos à déposer — Samuel Élagage

Chaque emplacement du site attend **un nom de fichier précis**. Déposez les
photos dans ce dossier (`clients/samuel-elagage/img/`) en écrasant les
placeholders — mêmes noms, même extension `.jpg` — puis relancez :

```bash
npm run build samuel-elagage
```

Chaque placeholder actuel affiche à l'écran la photo qu'il attend : en cas de
doute, ouvrez le site, la description est écrite sur l'image.

## Correspondance

| Fichier à déposer | Photo de Samuel à utiliser | Où ça apparaît |
|---|---|---|
| `hero.jpg` | Samuel dans un arbre / grande intervention en hauteur — **la plus spectaculaire**, format paysage | Image plein écran d'accueil |
| `portrait-samuel.jpg` | Son portrait en polaire orange avec la tronçonneuse — format **portrait** (vertical) | Section « L'artisan » |
| `toiture-avant.jpg` | Toiture entièrement couverte de mousse (sombre) | Réalisation 1 — avant |
| `toiture-apres.jpg` | La même toiture nettoyée, tuiles rouges | Réalisation 1 — après |
| `facade-avant.jpg` | Façade noircie avec les échelles posées | Réalisation 2 — avant |
| `facade-apres.jpg` | La même façade nettoyée, mur clair | Réalisation 2 — après |
| `abattage-tronc.jpg` | Le tronc abattu débité en sections | Réalisation 3 |
| `elagage-hauteur.jpg` | Élagage à l'échelle au-dessus d'une maison | Réalisation 4 |
| `haie-taillee.jpg` | La grande haie de conifères fraîchement taillée | Réalisation 5 |
| `creation-olivier.jpg` | L'entrée avec l'olivier et le gravier blanc | Réalisation 6 |
| `terrain-nettoye.jpg` | Le terrain débroussaillé, sol nu | Réalisation 7 |
| `camion-benne.jpg` | Le camion benne chargé de branches | Réalisation 8 |

## Deux points qui comptent

**Les paires avant/après doivent être cadrées pareil.** Le curseur de
comparaison superpose les deux images : si l'angle change entre l'avant et
l'après, l'effet tombe à plat. Les photos de toiture et de façade de Samuel
sont bien alignées — c'est ce qui en fait le meilleur argument du site.

**Le portrait doit être vertical.** Il s'affiche dans un cadre 4/5. Une photo
horizontale sera recadrée au centre et risque de couper la tête.

## Poids des fichiers

Si une photo dépasse ~1 Mo, réduisez-la à 1600 px de large avant de la
déposer (n'importe quel outil de redimensionnement fait l'affaire). Le site
reste ainsi rapide sur mobile, ce qui compte pour le référencement local.
