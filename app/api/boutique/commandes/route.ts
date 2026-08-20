import { NextRequest, NextResponse } from "next/server";
import { getRequestAccess } from "@/lib/access-control";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { buildShopPaymentIdentifier } from "@/lib/shop";

export async function GET(request: NextRequest) {
  if ((await getRequestAccess(request))?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });
  const { data, error } = await supabase.from("shop_orders").select("*, shop_products(nom)").order("id", { ascending: false });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ commandes: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });
  const body = await request.json();
  const productId = Number(body.product_id);
  const quantite = Math.max(1, Math.min(20, Math.round(Number(body.quantite) || 1)));
  const order = { product_id: productId, quantite, nom_client: String(body.nom_client || "").trim(), telephone: String(body.telephone || "").trim(), email: String(body.email || "").trim() || null, adresse: String(body.adresse || "").trim(), ville: String(body.ville || "").trim(), note: String(body.note || "").trim() || null };
  if (!productId || !order.nom_client || !order.telephone || !order.adresse || !order.ville) return NextResponse.json({ message: "Nom, téléphone, ville et adresse de livraison obligatoires." }, { status: 400 });
  const { data: product } = await supabase.from("shop_products").select("id, prix, stock, actif").eq("id", productId).single<{ id: number; prix: number; stock: number; actif: boolean }>();
  if (!product || !product.actif || product.stock < quantite) return NextResponse.json({ message: "Stock insuffisant pour cet article." }, { status: 409 });
  const identifier = buildShopPaymentIdentifier(Date.now());
  const { data: created, error } = await supabase.from("shop_orders").insert({ ...order, montant: product.prix * quantite, payment_identifier: identifier }).select("id, montant, payment_identifier").single();
  if (error || !created) return NextResponse.json({ message: error?.message || "Impossible de créer la commande." }, { status: 500 });
  return NextResponse.json({ commande: { id: created.id, montant: created.montant, identifier: created.payment_identifier }, paymentUrl: `/boutique/payer/${created.id}` }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if ((await getRequestAccess(request))?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });
  const body = await request.json();
  const allowed = ["en_attente", "paye", "en_preparation", "expedie", "livre", "annule"];
  if (!allowed.includes(String(body.statut || ""))) return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
  const { error } = await supabase.from("shop_orders").update({ statut: String(body.statut) }).eq("id", Number(body.id));
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
