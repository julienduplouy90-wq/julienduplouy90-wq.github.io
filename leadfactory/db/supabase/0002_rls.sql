-- À appliquer UNIQUEMENT sur Supabase (dépend de auth.uid()). Non exécuté en local (PGlite).
-- L'application serveur se connecte avec un rôle de service et filtre toujours par workspace_id ;
-- ces politiques protègent tout accès direct via la clé anon/authenticated (PostgREST, futur portail).

create or replace function public.is_workspace_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workspace_members m where m.workspace_id = ws and m.user_id = auth.uid());
$$;

do $$
declare t text;
begin
  foreach t in array array['projects','sites','partners','leads','lead_assignments','expenses','audit_log']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists ws_member_all on %I', t);
    execute format('create policy ws_member_all on %I for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))', t);
  end loop;
end $$;

alter table workspaces enable row level security;
drop policy if exists ws_member_read on workspaces;
create policy ws_member_read on workspaces for select to authenticated using (public.is_workspace_member(id));

alter table workspace_members enable row level security;
drop policy if exists self_read on workspace_members;
create policy self_read on workspace_members for select to authenticated using (user_id = auth.uid());

-- Tables enfants : accès via le parent.
alter table services enable row level security;
drop policy if exists via_project on services;
create policy via_project on services for all to authenticated
  using (exists (select 1 from projects p where p.id = project_id and public.is_workspace_member(p.workspace_id)));

alter table partner_projects enable row level security;
drop policy if exists via_partner on partner_projects;
create policy via_partner on partner_projects for all to authenticated
  using (exists (select 1 from partners p where p.id = partner_id and public.is_workspace_member(p.workspace_id)));

alter table partner_interactions enable row level security;
drop policy if exists via_partner on partner_interactions;
create policy via_partner on partner_interactions for all to authenticated
  using (exists (select 1 from partners p where p.id = partner_id and public.is_workspace_member(p.workspace_id)));

-- Aucun accès anon : le formulaire public passe par une route serveur validée (Zod + anti-spam).
alter table rate_limits enable row level security;
