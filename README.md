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
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
PAYGATE_TOKEN=
```

Important: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET` et `PAYGATE_TOKEN` doivent rester cote serveur. Ne pas les exposer dans le code client.

## Base Supabase

Executer le script `SUPABASE_SETUP.sql` dans Supabase SQL Editor pour creer ou completer les tables necessaires.

Tables principales:

- `routers`
- `profils`
- `tickets`
- `ventes`

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

Puis configurer les memes variables d'environnement dans Vercel.

## Securite production

- Regenerer les cles Supabase et PayGate si elles ont ete partagees.
- Garder la cle `SUPABASE_SERVICE_ROLE_KEY` uniquement dans les routes serveur.
- Utiliser un `ADMIN_SESSION_SECRET` long et unique.
- Activer les regles RLS Supabase pour bloquer les lectures/ecritures publiques non prevues.
- Garder les numeros de telephone masques dans les interfaces publiques.
- Tester les routes protegees sans cookie admin avant mise en ligne.
