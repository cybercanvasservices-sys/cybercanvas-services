import type { CyberCanvasD1 } from "@/lib/cloudflare-d1";

export type ShopProduct = {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  prix: number;
  stock: number;
  image_url: string | null;
  actif: number;
  created_at: string;
};

export async function ensureShopSchema(db: CyberCanvasD1) {
  await db.prepare(`create table if not exists shop_products (
    id integer primary key autoincrement,
    nom text not null,
    description text not null default '',
    categorie text not null default 'Équipements réseau',
    prix integer not null,
    stock integer not null default 0,
    image_url text,
    actif integer not null default 1,
    created_at text not null default current_timestamp,
    updated_at text not null default current_timestamp
  )`).run();

  await db.prepare(`create table if not exists shop_orders (
    id integer primary key autoincrement,
    product_id integer not null,
    quantite integer not null default 1,
    montant integer not null,
    nom_client text not null,
    telephone text not null,
    email text,
    adresse text not null,
    ville text not null,
    note text,
    statut text not null default 'en_attente',
    payment_identifier text,
    created_at text not null default current_timestamp,
    paid_at text
  )`).run();
}

export function buildShopPaymentIdentifier(orderId: number) {
  return `SHOP-${orderId}-${crypto.randomUUID()}`;
}
