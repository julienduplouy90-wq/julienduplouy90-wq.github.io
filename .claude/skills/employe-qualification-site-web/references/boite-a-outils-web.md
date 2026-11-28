# Boîte à outils : vérifier un prospect sur le web

Ce fichier dit où chercher chaque information et comment la lire. Selon l'outil où l'employé est installé, il a accès à la recherche web, à la lecture de pages, parfois à un navigateur. **S'il n'a pas accès à une source, il donne le lien à l'utilisateur et lui demande de coller ce qu'il voit** : 10 secondes de l'humain valent mieux qu'un chiffre deviné.

Chaque fait relevé porte sa source et sa date (ex. « 3,8 sur 5, 47 avis, fiche Google, vu le 12/11/2026 »).

Quatre règles de lecture :
- **Un fait vu seulement dans un extrait de recherche**, dont la page a disparu ou ne s'ouvre pas, est « non confirmé » : il peut aider à qualifier, il ne va jamais dans une fiche comme un fait sûr, ni dans un audit.
- **Un titre, une distinction, un chiffre de l'entreprise** se recopie avec la phrase source, sans la résumer : « mentor de l'équipe de France médaillée » n'est pas « médaillé ».
- **Une position sur Google ne se lit que sur une vraie page de résultats Google** (navigateur, ou capture de l'utilisateur). Un autre moteur de recherche donne d'autres résultats : il ne sert jamais à dire « vous êtes en page 2 ».
- **Les sources qui vendent contre l'agence** (plateformes de mise en relation, annuaires payants, autres agences) ne servent ni de contenu de relance ni de preuve.

## 1. Lire le code source de la page d'accueil
Il faut le HTML brut, pas le texte de la page : selon l'outil, une lecture de page « brute », la commande `curl` dans un terminal, ou « Afficher le code source » dans le navigateur (l'utilisateur peut le coller). Une lecture de page qui rend seulement le texte ne montre ni les liens `tel:`, ni le pixel, ni le CMS. On y voit en quelques secondes :

| Ce qu'on cherche | Ce qui le trahit dans le code | Ce que ça veut dire |
|---|---|---|
| Pixel Meta | `connect.facebook.net`, `fbevents.js`, `fbq('init'` | la boîte a déjà installé un suivi : elle croit à la publicité, ou l'a tentée |
| Google Analytics, Google Ads | `googletagmanager.com/gtag/js`, `G-XXXX`, `AW-XXXX` (Ads) | suivi en place ; `AW-` = elle a fait ou fait du Google Ads |
| Google Tag Manager | `googletagmanager.com/gtm.js`, `GTM-XXXX` | une agence ou un prestataire est passé par là |
| Le CMS | `wp-content` (WordPress), `static.parastorage.com` ou `wix` (Wix), `cdn.shopify.com` (Shopify), `squarespace`, `webflow`, `jimdo` | Wix ou Jimdo bricolé = signal faible ; Shopify = e-commerce |
| Responsive | `<meta name="viewport"` absent | le site n'est probablement pas adapté au mobile |
| Âge du site | l'année du © dans le pied de page, des messages périmés (« fermé pour cause de Covid ») | site figé, personne ne le met à jour |
| L'agence qui l'a fait | « réalisé par », « création », « site par », « design by », « propulsé par » dans le pied de page | l'agence actuelle ; si elle a disparu, c'est un client à prendre, et ses autres clients sont des prospects |
| Contact | liens `tel:` (lire le numéro : est-ce bien le sien ?), `mailto:`, présence d'un `<form` | un appel à l'action existe, à tester à la main |
| Liens cassés | liens internes vers des pages qui répondent 404 (« devis », « contact ») | un visiteur qui veut agir tombe sur une erreur |

Limite : sur certains sites (Wix, sites en JavaScript), le HTML brut ne montre pas tout. Dans ce cas, noter « non vérifiable dans le code » plutôt que conclure. Un défaut lu dans le code mais pas testé (un bouton d'appel qui compose un mauvais numéro, un formulaire absent du code) est « observé dans le code » : on peut le dire, avec un test à faire avant de le mettre dans l'audit.

**Ce qui demande un navigateur** : le premier écran (la règle des 30 secondes), le rendu sur téléphone, le formulaire jusqu'au bouton d'envoi. Sans navigateur, demander à l'utilisateur deux captures (le premier écran sur ordinateur et sur téléphone) et le test du formulaire, sans l'envoyer.

## 2. Le chiffre d'affaires et la taille
- **France** : l'Annuaire des entreprises de l'État (`annuaire-entreprises.data.gouv.fr`, ou son API ouverte `https://recherche-entreprises.api.gouv.fr/search?q=NOM`) donne, gratuitement et sans blocage, le SIREN, les dirigeants, la tranche d'effectif, la date de création, l'état (active ou fermée) et le CA quand il est publié. Attention : un CA à 0 ou absent veut dire « confidentiel », pas « nul ». Pappers et societe.com donnent la même chose, mais bloquent souvent les lectures automatiques.
- **Le contrôle du SIREN** : comparer le SIREN des mentions légales du site au registre (date de création, activité déclarée, adresse, état). Il repère les faux artisans et les sites de génération de contacts (« urgence 24 h/24 », « depuis 2010 » sur une société créée le mois dernier), et les sociétés fermées puis recréées.
- **Belgique** : la Banque nationale (bilans déposés). **Suisse** : Moneyhouse (pas de CA en général). **Québec** : le Registraire des entreprises (pas de CA).
- **Recherche Google** : « NOM chiffre d'affaires », « NOM effectif », et la rubrique Actualités.
- **Sans chiffre public, on déduit de l'infrastructure**, et on montre le calcul :
  - hôtel : nombre de chambres × prix moyen × 365 × taux de remplissage prudent (ex. 50 chambres × 120 € × 365 × 50 % = environ 1,1 M€) ;
  - restaurant : nombre de places × panier moyen × services par semaine ;
  - artisan, industrie : bâtiment, nombre de véhicules et de machines, effectif sur LinkedIn ;
  - services : nombre d'employés, nombre de bureaux, clients affichés, ancienneté, rachats ;
  - l'effectif comme repère, sans le convertir en euros : il faut à peu près 5 salariés pour qu'une entreprise de service paie un site à 4 000-6 000 €, 7 à 8 pour de la publicité gérée chaque mois ; un artisan dont le dirigeant est encore sur les chantiers est souvent trop petit ;
  - repère : le nombre d'avis Google × 10 donne une estimation basse du nombre de clients, à multiplier par le panier moyen.
  - Ne jamais inventer un ratio (chiffre d'affaires par salarié, masse salariale) : si rien ne permet d'estimer, le potentiel reste « à vérifier ».
- **Pièges** : peu de salariés ne veut pas dire une petite boîte (un hôtel qui sous-traite, un laboratoire) ; l'allure du site ne dit rien de la taille.

## 3. Le problème et la maturité marketing
- **Publicités Meta** : la bibliothèque publicitaire `facebook.com/ads/library/?active_status=active&ad_type=all&q=NOM` (pays à régler). Elle demande un navigateur : sinon, donner le lien à l'utilisateur.
- **Google Ads** : rechercher le mot-clé du métier et de la ville (ex. « couvreur Lyon ») et regarder si la boîte ou ses concurrents sortent en annonce.
- **Avis Google** : la note et le nombre d'avis (recherche « NOM avis »), et ce que disent les avis négatifs.
- **Vitesse et mobile** : PageSpeed Insights (`pagespeed.web.dev/analysis?url=URL`, ou l'API `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=URL&strategy=mobile`) : le score de performance mobile et le temps d'affichage principal (LCP). Sans clé, l'API refuse presque toujours (quota dépassé) : ne la relance pas en boucle. Une clé Google gratuite se règle une fois ; sinon, repère les défauts dans le code de la page (images très lourdes, pas de balise viewport) et donne le lien PageSpeed à l'utilisateur.
- **Visibilité** : rechercher « métier + ville » comme le ferait un client, sur mobile si possible, et noter la place du prospect et les 3 à 5 concurrents devant lui.
- **Trafic** : SimilarWeb (`similarweb.com/website/DOMAINE/`) donne une estimation, souvent fausse pour les petits sites : toujours dite « estimation ». Pour un artisan ou une petite entreprise, il n'a souvent aucun chiffre : le trafic est alors « inconnu », et la perte se dit en mots dans l'audit.
- **Volume de recherche** d'une requête : Google Keyword Planner, Ubersuggest ou Semrush. Sans accès, ne pas inventer : écrire « à vérifier dans Ubersuggest ».
- **Réseaux sociaux** : liens depuis le site, date de la dernière publication sur chaque réseau.
- **Actualités et communiqués** : recherche « NOM » dans Google Actualités et la presse locale (rachat, déménagement, prix, levée, nouveau directeur).
- **Recrutement** : page carrière, Indeed, LinkedIn Emplois, Welcome to the Jungle (« NOM recrute »).

## 4. Le décideur
Dans cet ordre :
1. la page Équipe ou À propos du site ;
2. les mentions légales (directeur de la publication, souvent le patron) ;
3. Pappers ou societe.com (dirigeants) ;
4. les communiqués de presse (le nom sous la photo) ;
5. LinkedIn : la page de l'entreprise, onglet Personnes, ou une recherche « NOM DE L'ENTREPRISE directeur commercial » ;
6. le format d'email, déduit d'une autre adresse visible (prenom.nom@domaine) : toujours marqué « à vérifier » ;
7. sinon, l'accueil au téléphone, par l'utilisateur.

Qui viser : « Plus on grossit à la tête de la boîte, plus on descend. » Jusqu'à 20 à 25 employés, le dirigeant. Au-delà, le responsable marketing ou commercial d'abord. Garder un second contact en réserve.

## 5. Trouver des prospects (sources de listes)
- **Listes d'exposants de salons** : rechercher « salon professionnel [secteur] [ville] », puis la page « Liste des exposants ». Le stand payé prouve déjà le potentiel et l'envie de croissance. Attention : sur les salons d'un métier d'artisans (toiture, plomberie), les exposants sont surtout les fournisseurs, et les artisans sont visiteurs.
- **Pour les artisans** : les annuaires des labels et des fédérations (annuaire RGE de France Rénov', Qualibat, adhérents CAPEB ou FFB de la région), puis les rebonds et Google Maps. L'annuaire RGE se lit mal sans navigateur : passe par ses données ouvertes (rechercher « liste des entreprises RGE data.ademe.fr », jeu de données interrogeable par ville et par domaine de travaux), qui donnent nom, SIRET, adresse, site et téléphone. Les annuaires de travaux grand public donnent souvent des noms sans site.
- **Annuaires de clubs** : BNI (pages des groupes et des membres), CJD, CPME, CCI, incubateurs, annuaires de la mairie.
- **Le rebond par l'agence** : le pied de page d'un site raté mène à l'agence, et ses réalisations mènent à ses autres clients.
- **Les voisins** : Google Maps autour d'une adresse, toute la rue ou la zone d'activité.
- **Google Maps, quartier par quartier** : « métier + quartier », résultats ouverts en rafale.
- **Outils payants** (Pharow, Kaspr, FullEnrich) : utiles pour filtrer par effectif (3 à 50 salariés), par croissance, et trouver les numéros. Ils accélèrent, ils ne qualifient pas.
