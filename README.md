# CyberCanvas Services

Interface Next.js pour gerer des routeurs WiFi, des groupes/profils, des tickets CSV, les ventes et les paiements PayGate via portail captif MikroTik.

## Fonctionnement principal

1. Creer un routeur dans `Mes Routeurs`.
2. Creer un groupe/profil WiFi dans `Mes Groupes`.
3. Importer les tickets CSV dans `Mes Tickets` pour le profil choisi.
4. Copier le lien de paiement du profil et le placer sur le portail captif MikroTik.
5. Le client paie via PayGate, puis revient sur `/payer` pour recevoir son ticket.
6. La vente est enregistree dans `Mes Recettes`.

## Lancement local

```bash
npm install
cp .env.example .env.local   # puis renseigner les variables
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Variables d'environnement

Voir `.env.example` pour la liste complete.

```env
NEXT_PUBLIC_Supabase_URL=
NEXT_PUBLIC_Supabase_ANON_KEY=
Supabase_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
PAYGATE_TOKEN=
PAYGATE_WEBHOOK_SECRET=
# optionnel
RESEND_API_KEY=
BREVO_API_KEY=
EMAIL_FROM=
ADMIN_ALERT_EMAIL=
```

Important: `Supabase_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET` et `PAYGATE_TOKEN` doivent rester cote serveur. Ne pas les exposer dans le code client.

## Base de donnees

Une seule base : **Supabase (Postgres)**. Toutes les tables (clients, routers,
profils, ventes, tickets, boutique) y vivent.

Executer les migrations dans l'ordre documente dans `migrations/README.md`
(dossier `migrations/Supabase/*.sql`, via Supabase SQL Editor).

Les anciennes donnees Cloudflare D1 (tickets, ventes, boutique) sont transferees
vers Supabase avec le script de migration de donnees (voir `migrations/README.md`).

## Deploiement (hebergeur au choix)

Projet Next.js standard (`next build` / `next start`), sans dependance
Cloudflare. Il se deploie tel quel sur :

- **Vercel** (detection automatique)
- **Netlify** (build: `npm run build`, publish: `.next`)
- **Cloudflare Pages** (build: `npm run build`, output: `.next`)
- **Serveur Node.js** : `npm run build` puis `npm run start`
- Tout hebergeur supportant Node.js / Next.js

Configurer les memes variables d'environnement cote hebergeur (voir
`.env.example`).

## PayGate

Dans PayGate, l'eCommerce doit etre actif, sinon l'API renvoie `403 eCommerce inactif`.

Adresse de retour locale:

```text
http://localhost:3000/payer
```

Adresse de retour production:

```text
https://votre-domaine.com/payer
```

## Verification avant mise en ligne

```bash
npm run lint
npm run build
```

## Securite production

- Regenerer les cles Supabase et PayGate si elles ont ete partagees.
- Garder la cle `Supabase_SERVICE_ROLE_KEY` uniquement dans les routes serveur.
- Utiliser un `ADMIN_SESSION_SECRET` long et unique.
- Les tables sensibles ont RLS active sans policy publique : seules les routes
  serveur (service_role) y accedent. La cle anon ne lit que la vue `public_profils`.
- Garder les numeros de telephone masques dans les interfaces publiques.
- Tester les routes protegees sans cookie admin avant mise en ligne.