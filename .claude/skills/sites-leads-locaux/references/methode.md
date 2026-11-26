# Méthode : structure, maillage, domaines, monétisation, tri

## Structure d'une page (implémentée dans build-site.mjs)
Au-dessus de la ligne de flottaison : titre accrocheur (H1 « Niche à Ville »), sous-titre, **formulaire de devis**
visible immédiatement, 3 arguments. Puis : services demandés, paragraphe local à **données réelles** (population INSEE,
département, communes proches avec distances), annuaire d'entreprises + JSON-LD, maillage, FAQ.

Le texte varie de façon déterministe par page (hash du code INSEE) pour éviter des pages strictement identiques.
Ce n'est pas du contenu « riche » : la valeur vient de la structure, des données locales et de l'annuaire.

## Maillage interne (modèle meilleursagents / meilleurtaux)
| Page | Liens |
|---|---|
| Accueil | tous les départements + top 20 villes de France |
| Département | principales villes du département (jusqu'à 60, par population) + départements limitrophes + top 20 France |
| Ville | 10 villes les plus proches + 20 autres villes du département + lien retour département + top 20 France |

Le fil d'Ariane (Accueil › Département › Ville) est aussi balisé en `BreadcrumbList`.

## JSON-LD
- `ItemList` de `LocalBusiness` reprenant **exactement** les entreprises affichées dans l'annuaire visible (Google
  exige que le balisage décrive le contenu visible de la page).
- `Service` avec `areaServed` (ville ou département), `BreadcrumbList`, `FAQPage`.
- Ne jamais baliser une entreprise listée comme éditeur du site ou comme prestataire du service.

## Domaines
- Extensions qui marchent : `.fr`, `.com`, `.net`, `.info`. Éviter `.xyz` et extensions low-cost (indexation médiocre).
- Domaine neuf à ~7–10 € : suffisant. Un expiré s'indexe un peu plus vite mais ne ranke pas mieux : mieux vaut
  10 domaines neufs qu'un expiré cher.
- Nom : mot-clé + intention (« devis-abri-piscine.fr », « pompe-chaleur-artisans.fr »). Vérifier la disponibilité
  et **demander l'accord de l'utilisateur avant tout achat**.

## Indexation
1. Search Console : propriété domaine, envoi de `sitemap.xml`.
2. Commencer avec `minPop` 5000 ; après indexation de la majorité des pages, regénérer à 2000 pour élargir.
3. Pas d'achat de liens automatisé ni de réseau de liens entre les 50 sites (empreinte facile à détecter).

## Monétisation
- **Plateformes** (achat en volume, simple) : ViteUnDevis, Travaux.com, HabitatPresto, Quotatis ; Bobex en Belgique.
  Vérifier leurs conditions d'affiliation : certaines n'achètent qu'en marque blanche (leur formulaire) → `leadWebhook`.
- **Artisans en direct** (plus rentable, plus de gestion) : contacter les entreprises de l'annuaire du département
  et proposer des leads exclusifs ; LeadFactory (branche `claude/leadfactory-saas-setup-jn4qv0`) gère qualification,
  partenaires, transmission et facturation.
- Le texte de consentement (`consentRecipients`) doit refléter le modèle choisi (1 artisan exclusif vs 3 acheteurs).

## Tri de la flotte
| Échéance | Mesure (Search Console + CSV des leads) | Décision |
|---|---|---|
| J+30 | % de pages indexées | < 10 % : vérifier robots/sitemap, ajouter des liens vers l'accueil depuis un site existant |
| J+60 | impressions / clics | 0 clic : laisser tourner, ne pas investir plus |
| J+90 | leads / mois | ≥ 10 leads : élargir (minPop 2000, annuaire complet), cloner en version régionale ; 0 lead : ne pas renouveler le domaine |

Ordre de grandeur rapporté sur des niches concurrentielles : 3 à 10 clics/jour par site qui fonctionne. Sur 50 sites,
viser 10–15 sites productifs.
