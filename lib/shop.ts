export type ShopProduct = {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  prix: number;
  stock: number;
  image_url: string | null;
  actif: boolean;
  created_at: string;
  updated_at?: string;
};

export type ShopOrder = {
  id: number;
  product_id: number;
  quantite: number;
  montant: number;
  nom_client: string;
  telephone: string;
  email: string | null;
  adresse: string;
  ville: string;
  note: string | null;
  statut: string;
  payment_identifier: string;
  created_at: string;
  paid_at: string | null;
  shop_products?: { nom: string } | null;
};

export function buildShopPaymentIdentifier(orderId: number) {
  return `SHOP-${orderId}-${crypto.randomUUID()}`;
}
