-- CyberCanvas Services - migrations Supabase
-- 006_rls_tickets_shop.sql
-- Active RLS sur les nouvelles tables : rien n'est lisible/ecrivable par anon.
-- Les routes serveur utilisent SUPABASE_SERVICE_ROLE_KEY (bypass RLS).

alter table public.tickets enable row level security;
alter table public.shop_products enable row level security;
alter table public.shop_orders enable row level security;

-- aucune policy : acces refuse par defaut pour anon et authenticated
select 1;