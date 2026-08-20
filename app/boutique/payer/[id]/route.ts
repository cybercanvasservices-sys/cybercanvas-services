import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  const token = process.env.PAYGATE_TOKEN;
  if (!supabase || !token) return new NextResponse("Paiement temporairement indisponible.", { status: 500 });
  const { data: order } = await supabase.from("shop_orders").select("id, montant, payment_identifier, shop_products(nom)").eq("id", Number(id)).single<{ id: number; montant: number; payment_identifier: string; shop_products: { nom: string } | null }>();
  if (!order) return new NextResponse("Commande introuvable.", { status: 404 });
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const retour = `${protocol}://${host}/boutique/confirmation?commande=${order.id}&identifier=${encodeURIComponent(order.payment_identifier)}`;
  const description = `Commande boutique - ${order.shop_products?.nom || "Article"}`;
  const url = `https://paygateglobal.com/v1/page?token=${encodeURIComponent(token)}&amount=${order.montant}&identifier=${encodeURIComponent(order.payment_identifier)}&description=${encodeURIComponent(description)}&url=${encodeURIComponent(retour)}`;
  return NextResponse.redirect(url);
}
