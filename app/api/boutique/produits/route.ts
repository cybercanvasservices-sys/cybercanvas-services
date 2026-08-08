import { NextRequest, NextResponse } from "next/server";
import { getTicketsDb } from "@/lib/cloudflare-d1";
import { getRequestAccess } from "@/lib/access-control";
import { ensureShopSchema, type ShopProduct } from "@/lib/shop";

export async function GET(request: NextRequest) {
  const db = await getTicketsDb();
  if (!db) return NextResponse.json({ message: "Base Cloudflare D1 indisponible." }, { status: 500 });
  await ensureShopSchema(db);

  const access = await getRequestAccess(request);
  const query = access?.role === "admin"
    ? "select * from shop_products order by id desc"
    : "select * from shop_products where actif = 1 and stock > 0 order by id desc";
  const { results } = await db.prepare(query).all<ShopProduct>();
  return NextResponse.json({ produits: results || [] });
}

export async function POST(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (access?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  const db = await getTicketsDb();
  if (!db) return NextResponse.json({ message: "Base Cloudflare D1 indisponible." }, { status: 500 });
  await ensureShopSchema(db);
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
  const produit = await db.prepare(`insert into shop_products
    (nom, description, categorie, prix, stock, image_url, actif)
    values (?, ?, ?, ?, ?, ?, 1) returning *`)
    .bind(nom, description, categorie, prix, stock, imageUrl || null).first<ShopProduct>();
  return NextResponse.json({ produit }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (access?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  const db = await getTicketsDb();
  if (!db) return NextResponse.json({ message: "Base Cloudflare D1 indisponible." }, { status: 500 });
  await ensureShopSchema(db);
  const body = await request.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ message: "Article introuvable." }, { status: 400 });
  const produit = await db.prepare(`update shop_products set nom = ?, description = ?, categorie = ?,
    prix = ?, stock = ?, image_url = ?, actif = ?, updated_at = current_timestamp where id = ? returning *`)
    .bind(String(body.nom || "").trim(), String(body.description || "").trim(), String(body.categorie || "Équipements réseau").trim(), Math.round(Number(body.prix)), Math.max(0, Math.round(Number(body.stock))), String(body.image_url || "").trim() || null, body.actif === false || body.actif === 0 ? 0 : 1, id)
    .first<ShopProduct>();
  return NextResponse.json({ produit });
}

export async function DELETE(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (access?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  const db = await getTicketsDb();
  if (!db) return NextResponse.json({ message: "Base Cloudflare D1 indisponible." }, { status: 500 });
  await ensureShopSchema(db);
  const id = Number(new URL(request.url).searchParams.get("id"));
  await db.prepare("update shop_products set actif = 0, updated_at = current_timestamp where id = ?").bind(id).run();
  return NextResponse.json({ success: true });
}
