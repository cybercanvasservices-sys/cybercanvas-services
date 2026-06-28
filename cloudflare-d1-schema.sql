create table if not exists tickets (
  id integer primary key autoincrement,
  profil_id integer not null,
  username text not null,
  password text not null,
  statut text not null default 'disponible' check (statut in ('disponible', 'vendu', 'reserve', 'expire')),
  sale_identifier text,
  sold_at text,
  created_at text not null default current_timestamp
);

create index if not exists idx_tickets_profil_id on tickets (profil_id);
create index if not exists idx_tickets_statut on tickets (statut);
create unique index if not exists idx_tickets_profil_username on tickets (profil_id, username);
