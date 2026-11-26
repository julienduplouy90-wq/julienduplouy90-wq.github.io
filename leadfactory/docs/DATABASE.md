# Base de données

PostgreSQL ≥ 15 (PGlite en local, Supabase en production). Schéma : `db/migrations/0001_init.sql`. RLS : `db/supabase/0002_rls.sql`.
Conventions : UUID, `timestamptz`, montants en **centimes** (`integer`), pays ISO 3166-1, devises ISO 4217, `is_demo` sur les données fictives.

```
workspaces ─┬─ workspace_members (futur Supabase Auth)
            ├─ projects ─┬─ services
            │            ├─ sites
            │            └─ partner_projects ─┐ (prix convenu, prospects offerts)
            ├─ partners ─┴─ partner_interactions
            ├─ leads ──── lead_assignments ── partners
            ├─ expenses
            └─ audit_log
rate_limits (technique)   schema_migrations (technique)
```

| Table | Rôle | Points clés |
|---|---|---|
| `workspaces` | Locataire | `lead_retention_days` (conservation, défaut 1095 j) |
| `projects` | Niche × zone | `zone_codes text[]` (départements/préfixes CP), `seo` et `qualification` en JSONB, `free_leads_per_partner` |
| `services` | Prestations du projet | copiées du modèle de niche à la création |
| `sites` | Site du projet | `slug` unique global, `status` draft/preview/published, `content.publisher` (mentions légales) |
| `partners` | CRM | 9 statuts, `source`, `verified_at`, `opted_out_at`, `services text[]`, `monthly_capacity` |
| `partner_projects` | Partenaire ↔ projet | `agreed_price_cents`, `free_leads_granted` |
| `partner_interactions` | Historique des échanges | canal + résumé |
| `leads` | Prospects | consentement **tracé** (texte exact, version, date), `ip_hash` (jamais l'IP), `dedupe_key`, `duplicate_of`, `score` + `score_details`, `reviewed_at`, `retention_until` |
| `lead_assignments` | Attributions | **index unique partiel** `(lead_id) where status in (validated, sent, accepted)` = exclusivité ; `billing_status` forecast/invoiced/paid/not_billable |
| `expenses` | Dépenses | catégories ads/domain/hosting/api/other ; `project_id` nul = frais généraux |
| `audit_log` | Journal | actions importantes, sans données personnelles |
| `rate_limits` | Limitation de débit | fenêtre fixe d'une heure |

## Effacement
`eraseLead` : suppression si aucune attribution, sinon **anonymisation** (nom, contacts, commune, description, réponses effacés ;
code postal réduit au département) afin de conserver l'historique comptable.
