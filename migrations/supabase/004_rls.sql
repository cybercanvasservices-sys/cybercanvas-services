-- CyberCanvas Services - migrations Supabase
-- 004_rls.sql
-- Active RLS sur toutes les tables. Aucune lecture/ecriture anon sauf
-- la vue publique public_profils (paiement public).
-- Les routes serveur utilisent la cle service_role qui contourne RLS.
-- A executer en dernier.

alter table public.clients enable row level security;
alter table public.password_reset_requests enable row level security;
alter table public.routers enable row level security;
alter table public.profils enable row level security;
alter table public.ventes enable row level security;
alter table public.retraits enable row level security;
alter table public.activity_logs enable row level security;

drop view if exists public.public_profils;
create view public.public_profils as
  select id, nom, prix, duree, slug
  from public.profils;

revoke all on public.public_profils from anon, authenticated;
grant select on public.public_profils to anon, authenticated;