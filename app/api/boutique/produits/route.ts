import { NextRequest, NextResponse } from "next/server";
import { getRequestAccess } from "@/lib/access-control";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import type { ShopProduct } from "@/lib/shop";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });

  const access = await getRequestAccess(request);

  let query = supabase
    .from("shop_products")
    .select("*")
    .order("id", { ascending: false });

  if (access?.role !== "admin") {
    query = query.eq("actif", true).gt("stock", 0);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: "Erreur lors de la lecture des produits." }, { status: 500 });
  }

  return NextResponse.json({ produits: (data || []) as ShopProduct[] });
}

export async function POST(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (access?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });

  const body = await request.json();
  const nom = String(body.nom || "").trim();
  const description = String(body.description || "").trim();
  const categorie = String(body.categorie || "Équipements réseau").trim();
  const prix = Math.round(Number(body.prix));
  const stock = Math.max(0, Math.round(Number(body.stock)));
  const imageUrl = String(body.image_url || "").trim();

  if (!nom || !description || !Number.isFinite(prix) || prix <= 0) {
    return NextResponse.json({ message: "Nom, description et prix valide obligatoires." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("shop_products")
    .insert({
      nom,
      description,
      categorie,
      prix,
      stock,
      image_url: imageUrl || null,
      actif: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: "Erreur lors de la création du produit." }, { status: 500 });
  }

  return NextResponse.json({ produit: data as ShopProduct }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (access?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });

  const body = await request.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ message: "Article introuvable." }, { status: 400 });

  const { data, error } = await supabase
    .from("shop_products")
    .update({
      nom: String(body.nom || "").trim(),
      description: String(body.description || "").trim(),
      categorie: String(body.categorie || "Équipements réseau").trim(),
      prix: Math.round(Number(body.prix)),
      stock: Math.max(0, Math.round(Number(body.stock))),
      image_url: String(body.image_url || "").trim() || null,
      actif: body.actif === false || body.actif === 0 ? false : true,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: "Erreur lors de la mise à jour du produit." }, { status: 500 });
  }

  return NextResponse.json({ produit: data as ShopProduct });
}

export async function DELETE(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (access?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });

  const id = Number(new URL(request.url).searchParams.get("id"));

  const { error } = await supabase
    .from("shop_products")
    .update({ actif: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: "Erreur lors de la désactivation du produit." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}