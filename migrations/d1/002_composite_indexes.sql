-- Index composite pour la vente : selection d'un ticket disponible par profil
create index if not exists idx_tickets_profil_statut on tickets (profil_id, statut);