# Tamboulou — site multi-pages pour Hostinger

Site statique de Tamboulou (l'école du chaman), généré par `build.py`, déployé
automatiquement sur Hostinger via la branche Git connectée dans hPanel.

## Structure

| URL | Rôle / mot-clé visé |
|---|---|
| `/` | Landing d'inscription (conversion) |
| `/formation-chamanisme/` | « formation chamanisme », « stage chamanisme » — page commerciale |
| `/voyage-chamanique/` | « voyage chamanique » — contenu de fond |
| `/animal-totem/` | « animal totem » — contenu de fond |
| `/faq/` | Longue traîne (questions) + données FAQPage |
| `/alexandre/` | E-E-A-T (qui transmet) |
| `/mentions-legales/` | Obligation légale, confiance |

`styles.css` est partagé par toutes les pages. `404.html`, `robots.txt`,
`sitemap.xml` et `.htaccess` complètent l'ensemble.

## Modifier le site

Les pages sont générées par **`build.py`** (contenus, méta, maillage interne,
données structurées, sitemap). Pour modifier : éditer `build.py` puis
`python3 build.py`. Ne pas éditer les `index.html` à la main (écrasés au
prochain build).

## Changer de domaine (tamboulou.fr)

Quand le vrai domaine est connecté dans hPanel : changer la constante `BASE`
en tête de `build.py`, relancer le build, pousser. Canoniques, Open Graph,
données structurées, robots.txt et sitemap suivent automatiquement.

## SEO — fait / à faire

Fait côté site : titres et descriptions uniques, canoniques, maillage interne,
breadcrumbs (visuels + JSON-LD), Organization/Course/FAQPage/Person,
sitemap.xml, robots.txt, page 404, mobile, performances (CSS partagée,
polices préconnectées, dimensions d'images).

À faire côté compte : acheter/connecter le domaine, vérifier la propriété
dans Google Search Console et soumettre `sitemap.xml`, créer la fiche
Google Business Profile, collecter des avis, obtenir des liens externes
(annuaires bien-être, site du lieu, presse locale).
