import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  const token = process.env.PAYGATE_TOKEN;

  if (!supabase || !token) {
    return new NextResponse("Paiement temporairement indisponible.", { status: 500 });
  }

  const { data: commande, error } = await supabase
    .from("shop_orders")
    .select("id, montant, payment_identifier, product_id")
    .eq("id", Number(id))
    .single();

  if (error || !commande) {
    return new NextResponse("Commande introuvable.", { status: 404 });
  }

  const { data: produit } = await supabase
    .from("shop_products")
    .select("nom")
    .eq("id", commande.product_id)
    .single();

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const retour = `${protocol}://${host}/boutique/confirmation?commande=${commande.id}&identifier=${encodeURIComponent(commande.payment_identifier)}`;
  const url = `https://paygateglobal.com/v1/page?token=${encodeURIComponent(token)}&amount=${commande.montant}&identifier=${encodeURIComponent(commande.payment_identifier)}&description=${encodeURIComponent(`Commande boutique - ${produit?.nom || "produit"}`)}&url=${encodeURIComponent(retour)}`;

  return NextResponse.redirect(url);
}