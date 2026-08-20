import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { checkPaygatePayment } from "@/lib/paygate";

export async function POST(request: NextRequest) {
  const { commande, identifier } = await request.json();
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });
  const { data: order } = await supabase.from("shop_orders").select("id, product_id, quantite, statut, payment_identifier").eq("id", Number(commande)).single<{ id: number; product_id: number; quantite: number; statut: string; payment_identifier: string }>();
  if (!order || order.payment_identifier !== identifier) return NextResponse.json({ message: "Commande invalide." }, { status: 400 });
  if (["paye", "en_preparation", "expedie", "livre"].includes(order.statut)) return NextResponse.json({ success: true, message: "Paiement déjà confirmé." });
  const payment = await checkPaygatePayment(identifier);
  if (!payment.ok) return NextResponse.json({ success: false, message: payment.message }, { status: payment.status });
  const { data: product } = await supabase.from("shop_products").select("stock").eq("id", order.product_id).single<{ stock: number }>();
  if (!product || product.stock < order.quantite) return NextResponse.json({ success: false, message: "Stock insuffisant." }, { status: 409 });
  const { error: stockError } = await supabase.from("shop_products").update({ stock: product.stock - order.quantite, updated_at: new Date().toISOString() }).eq("id", order.product_id).eq("stock", product.stock);
  if (stockError) return NextResponse.json({ success: false, message: stockError.message }, { status: 500 });
  const { error } = await supabase.from("shop_orders").update({ statut: "paye", paid_at: new Date().toISOString() }).eq("id", order.id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: "Paiement confirmé. Votre commande sera préparée pour la livraison." });
}
