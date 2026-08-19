create table if not exists tickets (
  id integer primary key autoincrement,
  profil_id integer not null,
  owner_email text,
  username text not null,
  password text not null,
  statut text not null default 'disponible' check (statut in ('disponible', 'vendu', 'reserve', 'expire')),
  sale_identifier text,
  sold_at text,
  created_at text not null default current_timestamp
);

create index if not exists idx_tickets_profil_id on tickets (profil_id);
create index if not exists idx_tickets_owner_email on tickets (owner_email);
create index if not exists idx_tickets_statut on tickets (statut);
create unique index if not exists idx_tickets_profil_username on tickets (profil_id, username);

create table if not exists ventes (
  id integer primary key autoincrement,
  profil_id integer not null,
  ticket_id integer not null,
  montant integer not null,
  telephone text not null default '',
  statut text not null default 'paye',
  owner_email text,
  sale_identifier text,
  created_at text not null default current_timestamp
);

create unique index if not exists idx_ventes_sale_identifier on ventes (sale_identifier);
create index if not exists idx_ventes_owner_email on ventes (owner_email);
create index if not exists idx_ventes_profil_id on ventes (profil_id);
