# Tambouloup — version statique pour Hostinger

Recréation fidèle du site https://julienduplouy90-wq.github.io/ en un site 100 % statique et autonome, prêt à être hébergé sur Hostinger (ou n'importe quel hébergeur).

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | La page complète (HTML + CSS + JS inclus, aucune dépendance de build) |
| `tambouloup-loup.jpeg` | Illustration du loup (héro) |
| `favicon.svg` | Favicon aux couleurs du site (tambour ambre sur fond nuit) |
| `404.html` | Page d'erreur personnalisée |
| `.htaccess` | Config Apache/LiteSpeed : page 404, compression, cache, en-têtes de sécurité |
| `robots.txt` | Autorise l'indexation |

## Déployer sur Hostinger (domaine temporaire)

1. Connectez-vous à **hPanel** → **Sites Web** → **Ajouter un site web** → *Site vide / Importer un site*.
   Hostinger attribue automatiquement un domaine temporaire du type `xxxxx.hstn.me` (offre Horizons/Website Builder) ou vous propose d'en créer un.
2. Ouvrez le **Gestionnaire de fichiers** du site, allez dans `public_html/`.
3. Téléversez `tambouloup-hostinger.zip` (à la racine de ce dossier) puis **Extraire** son contenu directement dans `public_html/`.
4. Supprimez le zip et le `default.php`/`index.php` d'exemple s'il existe.
5. Le site est en ligne sur le domaine temporaire. Rien d'autre à configurer.

Alternative : **hPanel → Sites Web → votre site → Importer un site web** accepte directement le zip et l'extrait tout seul.

## Améliorations par rapport à l'original

- **Plus léger et plus rapide** : suppression du runtime Next.js/React (~200 Ko de JS et le payload RSC) — le site est une seule page HTML autonome ; seul un petit script inline (menu + animations) subsiste.
- **Menu mobile** : l'original masquait totalement la navigation sur mobile ; un menu burger accessible (aria-expanded, fermeture au clic) la restitue.
- **Favicon de marque** : l'ancien favicon était l'icône par défaut du gabarit ; remplacé par un tambour ambre sur fond nuit.
- **Animations douces** : apparition des sections au défilement, pulsation du tambour, dérive des halos — toutes désactivées si `prefers-reduced-motion`, et le contenu reste visible sans JavaScript.
- **SEO** : données structurées JSON-LD (schema.org/Course avec lieu, prix, contact), `og:locale`, `theme-color`, robots.txt.
- **Accessibilité** : styles `:focus-visible` visibles, lien d'évitement conservé, libellés ARIA.
- **Hébergement** : page 404 personnalisée, `.htaccess` (compression, cache des images, en-têtes de sécurité).
- **Stabilité de mise en page** : dimensions déclarées sur l'image du héros (`width`/`height`, `fetchpriority="high"`).

Le contenu (textes, structure, couleurs, typographies DM Sans/Fraunces) est identique à l'original.
