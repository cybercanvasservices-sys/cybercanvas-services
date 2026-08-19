import { NextRequest, NextResponse } from "next/server";
import { checkPaygatePayment } from "@/lib/paygate";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

const CONFIRMED_STATUS = ["paye", "en_preparation", "expedie", "livre"];

export async function POST(request: NextRequest) {
  const { commande, identifier } = await request.json();

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });

  const { data: order, error: orderError } = await supabase
    .from("shop_orders")
    .select("id, product_id, quantite, statut, payment_identifier")
    .eq("id", Number(commande))
    .single();

  if (orderError || !order || order.payment_identifier !== identifier) {
    return NextResponse.json({ message: "Commande invalide." }, { status: 400 });
  }

  if (CONFIRMED_STATUS.includes(order.statut)) {
    return NextResponse.json({ success: true, message: "Paiement déjà confirmé." });
  }

  const payment = await checkPaygatePayment(identifier);
  if (!payment.ok) return NextResponse.json({ success: false, message: payment.message }, { status: payment.status });

  const { error: rpcError } = await supabase.rpc("confirm_shop_payment", {
    p_identifier: identifier,
    p_order_id: Number(commande),
  });

  if (rpcError) return NextResponse.json({ success: false, message: "Erreur lors de la confirmation du paiement." }, { status: 500 });

  return NextResponse.json({ success: true, message: "Paiement confirmé. Votre commande sera préparée pour la livraison." });
}