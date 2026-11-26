# Conformité — règles non négociables

Ces règles protègent l'utilisateur (amendes DGCCRF/CNIL, pénalités Google, perte des acheteurs) : les gabarits les
appliquent déjà, toute modification doit les respecter.

## Contenu
- **Aucun faux avis, faux témoignage ni fausse note** (pratique commerciale trompeuse, directive Omnibus).
  Afficher des avis seulement s'ils sont réels et vérifiables.
- **Aucun prix, délai, montant d'aide ou obligation réglementaire affirmé** sur les pages. Renvoyer vers le devis
  et vers france-renov.gouv.fr / mairie / SPANC selon la niche.
- **Pas d'urgence ni de peur fabriquées** (« toiture dangereuse », « cambriolages en hausse à X »), surtout pour les
  publics âgés (douche senior, monte-escalier).
- Le site dit clairement qu'il est un **service de mise en relation** et qu'il ne réalise pas les travaux.

## Annuaire d'entreprises
- Données publiques uniquement (nom, adresse, site, note). Pas de téléphone des entreprises listées sur un site qui
  capte des leads pour d'autres : ce serait détourner leurs clients.
- Mention visible : ni partenaires, ni recommandation ; retrait sur simple demande.
- Ne jamais se présenter comme l'une de ces entreprises ni utiliser leur marque dans le titre ou le domaine.

## Formulaire et données (RGPD)
- Case de consentement **non pré-cochée**, nommant le destinataire réel (`consentRecipients`).
- Politique de confidentialité : finalité, destinataires, durée (12 mois par défaut), droits, contact.
- Leads stockés hors racine web (`../leads-private/`), jamais commités, jamais envoyés à un tiers non mentionné.
- Anti-spam : champ piège, délai minimal, limite par IP hachée.

## Démarchage
- Rénovation énergétique (PAC, solaire, isolation, poêles, chaudières, audit) : le démarchage téléphonique non sollicité
  est interdit (loi 2020-901). Un lead = une **demande explicite** de l'internaute ; l'acheteur ne rappelle que pour
  ce projet. Ne jamais vendre ces contacts à des centres d'appels pour d'autres offres.
- Lien Bloctel dans la politique de confidentialité.

## Mentions légales
- Éditeur réel : nom/raison sociale, forme, SIRET, adresse, e-mail, directeur de publication, hébergeur.
  **Jamais inventés** : le build refuse de publier sans eux (`--draft` = `noindex`).
- L'activité de lead generation suppose une structure déclarée (micro-entreprise au minimum) pour facturer les acheteurs.

## Interdits
- Numéros surtaxés, faux services publics (horaires de déchetterie, préfecture, CAF…).
- Cloaking, contenus cachés, redirections trompeuses, pages copiées d'autres sites.
