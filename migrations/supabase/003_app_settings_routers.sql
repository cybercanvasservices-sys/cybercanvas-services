-- CyberCanvas Services - migrations Supabase
-- 003_app_settings_routers.sql
-- Colonnes routeurs + configuration globale (app_settings).
-- Idempotent : peut etre relance sans risque.

alter table public.routers
  add column if not exists description text,
  add column if not exists systeme text default 'MIKROTIK',
  add column if not exists dns_name text default 'wifi.cybercanvas.local',
  add column if not exists adresse text;

update public.routers
set
  description = coalesce(description, 'Point WiFi MikroTik'),
  systeme = coalesce(systeme, 'MIKROTIK'),
  dns_name = coalesce(dns_name, 'wifi.cybercanvas.local'),
  adresse = coalesce(adresse, token)
where
  description is null
  or systeme is null
  or dns_name is null
  or adresse is null;

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

insert into public.app_settings (key, value)
values
  ('support_whatsapp_local', '70693326'),
  ('support_whatsapp_full', '+22870693326'),
  ('support_whatsapp_link', 'https://wa.me/22870693326'),
  ('commission_retrait_percent', '10'),
  ('retrait_minimum_fcfa', '5000')
on conflict (key)
do update set
  value = excluded.value,
  updated_at = now();