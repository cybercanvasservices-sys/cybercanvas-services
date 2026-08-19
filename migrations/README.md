# Migrations CyberCanvas Services

## Ordre d'execution

### Supabase (Postgres)

Executer chaque fichier dans l'ordre, dans Supabase Dashboard > SQL Editor.
Tous sont idempotents (`create if not exists`, `add column if not exists`).

1. `migrations/supabase/001_base_schema.sql` — tables de base (clients, routers, profils, ventes, password_reset_requests) + colonnes `owner_email` + index.
2. `migrations/supabase/002_retraits_activity.sql` — retraits + activity_logs. Aligne l'ancien schema `retraits` (variante historique) sur celui utilise par le code.
3. `migrations/supabase/003_app_settings_routers.sql` — colonnes routeurs + `app_settings` (support WhatsApp, commission, minimum retrait).
4. `migrations/supabase/004_rls.sql` — active RLS partout, cree la vue publique `public_profils` (seule donnée lisible par la cle anon, pour les pages de paiement publiques). A executer en dernier.
5. `migrations/supabase/verify_rls.sql` — verifier l'etat RLS apres migration.

### Cloudflare D1 (SQLite)

```bash
npm run migrate:d1:local   # base locale (dev)
npm run migrate:d1:remote  # base de production
```

Fichiers appliques dans l'ordre :
1. `migrations/d1/001_tickets_ventes.sql` — tickets + ventes (Phase 3).
2. `migrations/d1/002_composite_indexes.sql` — index composite `tickets(profil_id, statut)`.

## Migration des ventes Supabase -> D1

Les ventes passent dans D1 (Phase 3). Les anciennes ventes encore dans Supabase
doivent etre migrees une fois.

```bash
# Apercu du SQL sans appliquer
npm run migrate:ventes:dry

# Application reelle (base D1 de production)
npm run migrate:ventes
```

Le script lit `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` depuis
l'environnement (charger `.env` avant), lit toutes les ventes Supabase par pages
et les insere dans D1 avec `insert or ignore` (id preserve, `sale_identifier`
mis a NULL). Les ventes existantes deja dans D1 ne sont pas dupliquees.

Une fois la migration terminee et validee, la table `public.ventes` de Supabase
peut etre supprimee (ou laissee, mais elle devient orpheline).

## Notes

- Les routes serveur utilisent la cle `SUPABASE_SERVICE_ROLE_KEY` qui contourne
  RLS : aucune policy supplementaire n'est necessaire pour l'API.
- La cle anon (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) ne peut lire que
  `public_profils` ; toute autre lecture/ecriture directe depuis le navigateur
  echoue.