# Journal des décisions

Format : date — décision — raison — statut (✅ appliquée, ⏳ à valider par le propriétaire).

| # | Date | Décision | Raison | Statut |
|---|---|---|---|---|
| 1 | 2026-11-26 | Application dans `leadfactory/` du dépôt GitHub Pages existant, branche dédiée | Ne pas casser le site statique existant ; démarrage immédiat | ✅ — ⏳ migrer vers un **dépôt privé dédié** (recommandé) |
| 2 | 2026-11-26 | PostgreSQL embarqué (PGlite) en local, Supabase en production via la même interface SQL | Zéro installation, zéro coût, même schéma partout ; tests d'intégration réels | ✅ |
| 3 | 2026-11-26 | SQL paramétré sans ORM ; logique métier pure dans `src/lib/domain` | Moins de dépendances, testabilité, transparence | ✅ |
| 4 | 2026-11-26 | Next.js 16.4, React 19.3, TypeScript 5.9 (pas 7.0), Vitest 4.1, Zod 4, Tailwind 4 | Versions stables ≥ 2 semaines ; TypeScript 7 et Vitest 5 trop récents | ✅ |
| 5 | 2026-11-26 | Composants UI façon shadcn écrits à la main (pas de CLI shadcn/Radix) | Besoins simples, aucune dépendance supplémentaire ; migration possible plus tard | ✅ |
| 6 | 2026-11-26 | Mono-utilisateur + HTTP Basic (`ADMIN_PASSWORD`) au lieu de Supabase Auth | Suffisant tant que vous êtes seul ; schéma `workspace_members` prêt | ✅ |
| 7 | 2026-11-26 | Niches définies en code, projets en base | Garde-fou éditorial (pas de contenu inventé) ; nouveau projet sans code | ✅ |
| 8 | 2026-11-26 | Aucune page géographique par commune dans le MVP | Éviter les pages pauvres ; à créer uniquement avec contenu réel | ✅ |
| 9 | 2026-11-26 | Données de démo dans un projet fictif séparé (`is_demo`), purge en un clic | Ne pas polluer le pilote réel | ✅ |
| 10 | 2026-11-26 | Score indicatif + validation humaine obligatoire ; transmission manuelle | Exigence du cahier des charges ; authenticité non présumée | ✅ |
| 11 | 2026-11-26 | Effacement = anonymisation si le prospect a été attribué | Concilier droit à l'effacement et historique comptable | ✅ |
| 12 | 2026-11-26 | Conservation des prospects : 3 ans par défaut | Valeur prudente usuelle pour la prospection ; configurable | ⏳ |
| 13 | 2026-11-26 | Prix cible 50 €/prospect exclusif, 2 offerts par partenaire | Hypothèses du cahier des charges, paramétrables | ⏳ |
| 14 | — | Hébergement de production | **Vercel Hobby interdit l'usage commercial** → Vercel Pro (~20 $/mois) ou alternative ; Supabase gratuit met en pause les projets inactifs | ⏳ |
| 15 | — | Nom de marque et domaine du site pilote | « Assainissement Dordogne » est provisoire | ⏳ |
| 16 | 2026-11-26 | Navigation simplifiée en deux espaces (Leads / Sites) ; projet et site fusionnés dans l'interface ; distribution intégrée aux étapes des prospects | Retour du propriétaire : navigation pas assez fluide ni simple | ✅ |
