# Tâches

## Fait (phase 1)
- [x] Projet Next.js 16 / TypeScript strict / Tailwind 4 dans `leadfactory/`
- [x] Schéma PostgreSQL multi-tenant + RLS Supabase
- [x] Moteurs : qualification 0–100, distribution, finances, import CSV
- [x] Back-office : dashboard, projets, sites, prospects, partenaires, distribution, finances, paramètres
- [x] Site pilote Assainissement Dordogne + formulaire progressif 9 étapes
- [x] Anti-spam, limitation de débit, doublons, consentement tracé, export/effacement
- [x] Tests : 22 unitaires/intégration, 8 e2e (desktop + mobile)
- [x] Documentation

## À faire par vous (propriétaire)
- [ ] Trancher les décisions ⏳ de `docs/DECISIONS.md` (hébergement, marque, domaine, conservation, prix)
- [ ] Exporter la liste des 20 partenaires en CSV et l'importer (`/partenaires/import`)
- [ ] Renseigner les informations éditeur dans **Sites**
- [ ] Relire les textes du site pilote (accueil, services, FAQ)
- [ ] Supprimer les données de démonstration une fois l'outil pris en main

## Prochaines tâches techniques (phase 2)
- [ ] Notification e-mail au propriétaire lors d'une nouvelle demande (après choix du fournisseur)
- [ ] Script de déploiement Supabase (migrations + RLS) et guide pas à pas
- [ ] Liaison automatique partenaire ↔ projet lors de l'import CSV (colonne Projet)
- [ ] Édition des contenus du site (titre, FAQ) depuis le back-office
- [ ] Sauvegarde/export complet de la base locale
