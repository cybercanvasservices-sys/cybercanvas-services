# Migrations CyberCanvas Services

## Base de donnees

Une seule base : **Supabase (Postgres)**. Cloudflare D1 a ete retire :
tickets, ventes et boutique vivent desormais dans Supabase.

## Ordre d'execution

**Recommande :** executer le fichier unique `migrations/supabase/000_full_migration.sql`
dans Supabase Dashboard > SQL Editor. Il applique toutes les migrations dans
l'ordre (001 -> 006) et se termine par une verification RLS.

Pour rejouer une etape precise, les fichiers individuels restent disponibles
(ordre ci-dessous). Tous sont idempotents (`create if not exists`,
`add column if not exists`, `create or replace function`).

1. `migrations/supabase/001_base_schema.sql` — tables de base (clients, routers, profils, ventes, password_reset_requests) + colonnes `owner_email` + index.
2. `migrations/supabase/002_retraits_activity.sql` — retraits + activity_logs. Aligne l'ancien schema `retraits` (variante historique) sur celui utilise par le code.
3. `migrations/supabase/003_app_settings_routers.sql` — colonnes routeurs + `app_settings` (support WhatsApp, commission, minimum retrait).
4. `migrations/supabase/004_rls.sql` — active RLS partout, cree la vue publique `public_profils` (seule donnée lisible par la cle anon, pour les pages de paiement publiques). A executer en dernier.
5. `migrations/supabase/005_shop_tickets_rpc.sql` — tables `tickets`, `shop_products`, `shop_orders`, colonne `ventes.sale_identifier` + fonctions RPC `sell_ticket` et `confirm_shop_payment` (transactions atomiques).
6. `migrations/supabase/006_rls_tickets_shop.sql` — active RLS sur les nouvelles tables (aucune policy publique).
7. `migrations/supabase/verify_rls.sql` — verifier l'etat RLS apres migration.

## Migration des donnees Cloudflare D1 -> Supabase

Une seule fois, pour recuperer les anciennes donnees D1 (tickets, ventes,
shop_products, shop_orders) vers Supabase.

```bash
# Apercu (3 lignes par table) sans rien inserer
npm run migrate:data:dry

# Application reelle sur la base D1 de production (--remote) ou locale (--local)
npm run migrate:data            # equivalent a --remote
node scripts/migrate-d1-to-supabase.mjs --local
```

Le script lit `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` depuis
l'environnement (charger `.env` avant), exporte chaque table via
`wrangler d1 execute` puis l'insere dans Supabase avec `on conflict (id)
do nothing` (idempotent : rejouer ne duplique rien).

Tables migrees : `tickets`, `ventes`, `shop_products`, `shop_orders`.

## Notes

- Les routes serveur utilisent la cle `SUPABASE_SERVICE_ROLE_KEY` qui contourne
  RLS : aucune policy supplementaire n'est necessaire pour l'API.
- La cle anon (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) ne peut lire que la vue
  `public_profils` ; toute autre lecture/ecriture directe depuis le navigateur
  echoue.
- La vente d'un ticket se fait via la fonction RPC `sell_ticket` : elle marque
  le ticket `vendu` et insere la vente dans une seule transaction Postgres
  (plus de compensation manuelle). La confirmation d'une commande boutique se
  fait via `confirm_shop_payment` (paiement + decrement du stock, atomique).