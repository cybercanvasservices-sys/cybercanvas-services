-- Les identifiants routers sont des UUID
alter table public.routers
  add column if not exists numero_retrait text;

-- Si routeur_id a été créé par erreur en bigint et ne contient encore aucune valeur
alter table public.retraits drop constraint if exists retraits_routeur_id_fkey;
alter table public.retraits drop column if exists routeur_id;
alter table public.retraits add column routeur_id uuid references public.routers(id);

create index if not exists idx_routers_owner_email on public.routers(owner_email);
create index if not exists idx_retraits_routeur_id on public.retraits(routeur_id);

-- Chaque profil et ticket appartient a un Cyber
alter table public.profils add column if not exists routeur_id uuid references public.routers(id);
alter table public.tickets add column if not exists routeur_id uuid references public.routers(id);
create index if not exists idx_profils_routeur_id on public.profils(routeur_id);
create index if not exists idx_tickets_routeur_id on public.tickets(routeur_id);
