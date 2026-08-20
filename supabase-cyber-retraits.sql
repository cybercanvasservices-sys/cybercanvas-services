-- Numéro de retrait propre à chaque Cyber
alter table public.routers
  add column if not exists numero_retrait text;

-- Cyber concerné par chaque demande de retrait
alter table public.retraits
  add column if not exists routeur_id bigint references public.routers(id);

create index if not exists idx_routers_owner_email
  on public.routers(owner_email);

create index if not exists idx_retraits_routeur_id
  on public.retraits(routeur_id);