alter table public.routers
  add column if not exists owner_email text;

alter table public.profils
  add column if not exists owner_email text;

alter table public.ventes
  add column if not exists owner_email text;

create index if not exists idx_routers_owner_email on public.routers(owner_email);
create index if not exists idx_profils_owner_email on public.profils(owner_email);
create index if not exists idx_ventes_owner_email on public.ventes(owner_email);
