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

export function buildShopPaymentIdentifier(orderId: number) {
  return `SHOP-${orderId}-${crypto.randomUUID()}`;
}