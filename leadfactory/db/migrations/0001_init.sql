-- LeadFactory — schéma initial (PostgreSQL 15+ / Supabase / PGlite)
-- Conventions : montants en centimes (integer), devises ISO 4217, pays ISO 3166-1 alpha-2,
-- toutes les tables métier portent workspace_id (préparation multi-tenant).

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_locale text not null default 'fr-FR',
  default_currency text not null default 'EUR',
  lead_retention_days integer not null default 1095, -- 3 ans, configurable
  created_at timestamptz not null default now()
);

-- Futur : lien avec auth.users (Supabase Auth). Non utilisé en mode local mono-utilisateur.
create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  slug text not null,
  name text not null,
  niche text not null,                       -- clé de niche, ex. 'assainissement'
  country text not null default 'FR',
  locale text not null default 'fr-FR',
  currency text not null default 'EUR',
  zone_label text not null,                  -- ex. 'Dordogne (24)'
  zone_codes text[] not null default '{}',   -- départements ou préfixes de codes postaux, ex. {'24'}
  domain text,
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  target_price_cents integer not null default 0 check (target_price_cents >= 0),
  budget_cents integer not null default 0 check (budget_cents >= 0),
  free_leads_per_partner integer not null default 2 check (free_leads_per_partner >= 0),
  objectives text,
  seo jsonb not null default '{}'::jsonb,
  qualification jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  slug text not null,
  name text not null,
  summary text not null default '',
  sort integer not null default 0,
  unique (project_id, slug)
);

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  slug text not null unique,                 -- identifiant de prévisualisation /s/<slug>
  template text not null default 'local-service-v1',
  status text not null default 'draft' check (status in ('draft','preview','published')),
  domain text unique,
  content jsonb not null default '{}'::jsonb, -- textes, FAQ, mentions éditeur
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  address text,
  zone_label text,
  zone_codes text[] not null default '{}',
  services text[] not null default '{}',     -- slugs de services
  accepted_price_cents integer check (accepted_price_cents >= 0),
  monthly_capacity integer check (monthly_capacity >= 0),
  status text not null default 'to_contact' check (status in (
    'to_contact','contacted','followed_up','interested','negotiating','active','refused','inactive','opted_out')),
  source text,                               -- provenance des coordonnées (obligatoire RGPD en pratique)
  verified_at date,
  opted_out_at timestamptz,
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists partners_ws_status_idx on partners (workspace_id, status);

create table if not exists partner_projects (
  partner_id uuid not null references partners(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  agreed_price_cents integer check (agreed_price_cents >= 0),
  free_leads_granted integer not null default 2,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (partner_id, project_id)
);

create table if not exists partner_interactions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  channel text not null default 'email' check (channel in ('email','phone','meeting','other')),
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  status text not null default 'new' check (status in (
    'new','qualified','rejected','assigned','sent','sold','refused_by_partner')),
  full_name text not null,
  email text,
  phone text,
  postal_code text not null,
  city text,
  service_slug text,
  description text,
  timeline text,
  answers jsonb not null default '{}'::jsonb, -- réponses spécifiques à la niche
  consent_transmission boolean not null,
  consent_text text not null,                 -- texte exact affiché, pour traçabilité
  consent_version text not null,
  consent_at timestamptz not null,
  ip_hash text,                               -- hash salé, jamais l'IP en clair
  user_agent text,
  source_url text,
  dedupe_key text not null,
  duplicate_of uuid references leads(id) on delete set null,
  score integer check (score between 0 and 100),
  score_details jsonb,
  reviewed_at timestamptz,                    -- validation humaine
  review_note text,
  retention_until date,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists leads_ws_project_created_idx on leads (workspace_id, project_id, created_at desc);
create index if not exists leads_dedupe_idx on leads (project_id, dedupe_key);

create table if not exists lead_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  partner_id uuid not null references partners(id) on delete restrict,
  status text not null default 'validated' check (status in (
    'validated','sent','accepted','refused','cancelled')),
  price_cents integer not null default 0 check (price_cents >= 0),
  is_free boolean not null default false,
  billing_status text not null default 'forecast' check (billing_status in (
    'forecast','invoiced','paid','not_billable')),
  validated_at timestamptz not null default now(),
  sent_at timestamptz,
  invoiced_at timestamptz,
  paid_at timestamptz,
  note text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
-- Exclusivité : un prospect ne peut avoir qu'une seule attribution vivante.
create unique index if not exists lead_assignments_one_live_per_lead
  on lead_assignments (lead_id) where status in ('validated','sent','accepted');

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  category text not null check (category in ('ads','domain','hosting','api','other')),
  label text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'EUR',
  spent_on date not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id bigint generated always as identity primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  actor text not null,
  action text not null,
  entity text not null,
  entity_id text,
  data jsonb,
  created_at timestamptz not null default now()
);

-- Limitation de débit des formulaires publics (compatible serverless).
create table if not exists rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
