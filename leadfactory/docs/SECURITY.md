# Sécurité et conformité (RGPD)

## En place dans le MVP
| Exigence | Mise en œuvre |
|---|---|
| Isolation des données | `workspace_id` sur toutes les tables métier et dans chaque requête ; politiques RLS Supabase prêtes (`db/supabase/0002_rls.sql`) |
| Validation serveur | Zod sur le formulaire public, les projets, partenaires, dépenses, import CSV ; SQL toujours paramétré |
| Secrets | Variables d'environnement uniquement (`.env.local` ignoré par Git, `.env.example` sans valeur sensible) |
| Accès administration | HTTP Basic via `ADMIN_PASSWORD` ; **administration désactivée en production si absent** (503) |
| Formulaires publics | Pot de miel, délai minimal de saisie (4 s), 5 demandes/heure par IP hachée et par site, réponse identique pour les robots |
| Doublons | Même téléphone ou e-mail sur le même projet dans les 90 jours → marqué doublon, score réduit, rejet recommandé |
| Minimisation | Champs strictement utiles ; IP stockée uniquement sous forme d'empreinte salée (`IP_HASH_SALT`) |
| Traçabilité du consentement | Texte exact, version (`CONSENT_VERSION`) et horodatage enregistrés avec chaque prospect ; transmission à **un seul** partenaire |
| Conservation | Durée configurable (Paramètres), date `retention_until` par prospect, anonymisation des prospects expirés |
| Droits des personnes | Export JSON (accès/portabilité) et effacement/anonymisation depuis la fiche prospect |
| Opposition à la prospection | Statut partenaire dédié + date ; bandeau d'avertissement ; exclusion automatique de la distribution |
| Journalisation | `audit_log` : créations, qualifications, attributions, facturation, imports, exports, purges |
| En-têtes HTTP | `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy` ; JSON-LD échappé |
| Données de test | Exclusivement fictives (`@example.com`, numéros factices, mention « (fictif) ») |

## Prospection B2B (partenaires)
La prospection par e-mail d'entreprises est gérée hors de l'outil. Bonnes pratiques à respecter : coordonnées professionnelles
issues de sources légitimes (colonne **Source**), message en rapport avec l'activité, possibilité de s'opposer à chaque envoi,
mise à jour immédiate du statut « Opposition à la prospection ».

## Avant toute mise en production (bloquant)
1. Définir `ADMIN_PASSWORD` (long, unique) et `IP_HASH_SALT` (aléatoire).
2. Remplacer l'authentification Basic par Supabase Auth dès qu'il y a plus d'un utilisateur.
3. Appliquer la RLS Supabase ; utiliser une connexion serveur dédiée (jamais la clé service côté client).
4. Compléter les mentions légales et la politique de confidentialité (éditeur, SIRET, hébergeur, contact).
5. Tenir un registre des traitements ; signer un accord de traitement/transmission avec chaque partenaire.
6. Vérifier la conformité juridique des textes (consentement, mentions) — non fournie par l'outil.
