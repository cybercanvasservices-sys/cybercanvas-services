import { NextRequest, NextResponse } from "next/server";
import { getTicketsDb } from "@/lib/cloudflare-d1";
import { getRequestAccess } from "@/lib/access-control";
import { buildShopPaymentIdentifier, ensureShopSchema, type ShopProduct } from "@/lib/shop";

export async function GET(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (access?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  const db = await getTicketsDb();
  if (!db) return NextResponse.json({ message: "Base Cloudflare D1 indisponible." }, { status: 500 });
  await ensureShopSchema(db);
  const { results } = await db.prepare(`select o.*, p.nom as produit_nom from shop_orders o
    left join shop_products p on p.id = o.product_id order by o.id desc`).all();
  return NextResponse.json({ commandes: results || [] });
}

export async function POST(request: NextRequest) {
  const db = await getTicketsDb();
  if (!db) return NextResponse.json({ message: "Base Cloudflare D1 indisponible." }, { status: 500 });
  await ensureShopSchema(db);
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
  const produit = await db.prepare("select * from shop_products where id = ? and actif = 1").bind(productId).first<ShopProduct>();
  if (!produit || produit.stock < quantite) return NextResponse.json({ message: "Stock insuffisant pour cet article." }, { status: 409 });
  const montant = produit.prix * quantite;
  const commande = await db.prepare(`insert into shop_orders
    (product_id, quantite, montant, nom_client, telephone, email, adresse, ville, note)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?) returning id`)
    .bind(productId, quantite, montant, nom, telephone, email || null, adresse, ville, note || null).first<{ id: number }>();
  if (!commande) return NextResponse.json({ message: "Impossible de créer la commande." }, { status: 500 });
  const identifier = buildShopPaymentIdentifier(commande.id);
  await db.prepare("update shop_orders set payment_identifier = ? where id = ?").bind(identifier, commande.id).run();
  return NextResponse.json({ commande: { id: commande.id, montant, identifier }, paymentUrl: `/boutique/payer/${commande.id}` }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (access?.role !== "admin") return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  const db = await getTicketsDb();
  if (!db) return NextResponse.json({ message: "Base Cloudflare D1 indisponible." }, { status: 500 });
  await ensureShopSchema(db);
  const body = await request.json();
  const allowed = ["en_attente", "paye", "en_preparation", "expedie", "livre", "annule"];
  const statut = String(body.statut || "");
  if (!allowed.includes(statut)) return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
  await db.prepare("update shop_orders set statut = ? where id = ?").bind(statut, Number(body.id)).run();
  return NextResponse.json({ success: true });
}
