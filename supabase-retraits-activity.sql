create table if not exists public.retraits (
  id bigserial primary key,
  owner_email text not null,
  client_nom text not null default '',
  client_telephone text not null default '',
  numero_paiement text not null,
  montant integer not null check (montant >= 2000),
  commission integer not null default 0,
  net integer not null default 0,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'valide', 'refuse')),
  note_admin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_retraits_owner_email on public.retraits(owner_email);
create index if not exists idx_retraits_statut on public.retraits(statut);
create index if not exists idx_retraits_created_at on public.retraits(created_at desc);

create table if not exists public.activity_logs (
  id bigserial primary key,
  actor_email text,
  owner_email text,
  role text not null default 'systeme',
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_owner_email on public.activity_logs(owner_email);
create index if not exists idx_activity_logs_action on public.activity_logs(action);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);
