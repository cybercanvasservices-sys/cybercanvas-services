import { NextRequest, NextResponse } from "next/server";
import { getTicketsDb } from "@/lib/cloudflare-d1";
import { checkPaygatePayment } from "@/lib/paygate";
import { ensureShopSchema } from "@/lib/shop";

export async function POST(request: NextRequest) {
  const { commande, identifier } = await request.json();
  const db = await getTicketsDb();
  if (!db) return NextResponse.json({ message: "Base indisponible." }, { status: 500 });
  await ensureShopSchema(db);
  const order = await db.prepare("select id, product_id, quantite, statut, payment_identifier from shop_orders where id = ?").bind(Number(commande)).first<{ id: number; product_id: number; quantite: number; statut: string; payment_identifier: string }>();
  if (!order || order.payment_identifier !== identifier) return NextResponse.json({ message: "Commande invalide." }, { status: 400 });
  if (order.statut === "paye" || order.statut === "en_preparation" || order.statut === "expedie" || order.statut === "livre") return NextResponse.json({ success: true, message: "Paiement déjà confirmé." });
  const payment = await checkPaygatePayment(identifier);
  if (!payment.ok) return NextResponse.json({ success: false, message: payment.message }, { status: payment.status });
  await db.prepare("update shop_orders set statut = 'paye', paid_at = current_timestamp where id = ?").bind(order.id).run();
  await db.prepare("update shop_products set stock = max(stock - ?, 0), updated_at = current_timestamp where id = ?").bind(order.quantite, order.product_id).run();
  return NextResponse.json({ success: true, message: "Paiement confirmé. Votre commande sera préparée pour la livraison." });
}
