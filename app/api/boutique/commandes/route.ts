import { NextRequest, NextResponse } from "next/server";
import { getRequestAccess } from "@/lib/access-control";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { buildShopPaymentIdentifier } from "@/lib/shop";

const ALLOWED_STATUS = ["en_attente", "paye", "en_preparation", "expedie", "livre", "annule"];

export async function GET(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (access?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from("shop_orders").select("*").order("id", { ascending: false }),
    supabase.from("shop_products").select("id, nom"),
  ]);

  const productNomById = new Map((products || []).map((p) => [p.id, p.nom]));

  const commandes = (orders || []).map((order) => ({
    ...order,
    produit_nom: productNomById.get(order.product_id) || "Produit inconnu",
  }));

  return NextResponse.json({ commandes });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });

  const body = await request.json();
  const productId = Number(body.product_id);
  const quantite = Math.max(1, Math.min(20, Math.round(Number(body.quantite) || 1)));
  const nom = String(body.nom_client || "").trim();
  const telephone = String(body.telephone || "").trim();
  const email = String(body.email || "").trim();
  const adresse = String(body.adresse || "").trim();
  const ville = String(body.ville || "").trim();
  const note = String(body.note || "").trim();

  if (!productId || !nom || !telephone || !adresse || !ville) {
    return NextResponse.json({ message: "Nom, téléphone, ville et adresse de livraison obligatoires." }, { status: 400 });
  }

  const { data: produit, error: produitError } = await supabase
    .from("shop_products")
    .select("id, prix, stock")
    .eq("id", productId)
    .eq("actif", true)
    .single();

  if (produitError || !produit) return NextResponse.json({ message: "Stock insuffisant pour cet article." }, { status: 409 });
  if (Number(produit.stock) < quantite) return NextResponse.json({ message: "Stock insuffisant pour cet article." }, { status: 409 });

  const montant = Number(produit.prix) * quantite;

  const { data: commande, error: commandeError } = await supabase
    .from("shop_orders")
    .insert({
      product_id: productId,
      quantite,
      montant,
      nom_client: nom,
      telephone,
      email: email || null,
      adresse,
      ville,
      note: note || null,
      statut: "en_attente",
    })
    .select("id")
    .single();

  if (commandeError || !commande) return NextResponse.json({ message: "Impossible de créer la commande." }, { status: 500 });

  const identifier = buildShopPaymentIdentifier(commande.id);

  const { error: identifierError } = await supabase
    .from("shop_orders")
    .update({ payment_identifier: identifier })
    .eq("id", commande.id);

  if (identifierError) return NextResponse.json({ message: "Impossible de créer la commande." }, { status: 500 });

  return NextResponse.json(
    { commande: { id: commande.id, montant, identifier }, paymentUrl: `/boutique/payer/${commande.id}` },
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (access?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });

  const body = await request.json();
  const statut = String(body.statut || "");
  const id = Number(body.id);

  if (!ALLOWED_STATUS.includes(statut)) return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
  if (!id) return NextResponse.json({ message: "Commande introuvable." }, { status: 400 });

  const { error } = await supabase
    .from("shop_orders")
    .update({ statut })
    .eq("id", id);

  if (error) return NextResponse.json({ message: "Erreur lors de la mise à jour de la commande." }, { status: 500 });

  return NextResponse.json({ success: true });
}