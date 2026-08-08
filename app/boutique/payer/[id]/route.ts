import { NextRequest, NextResponse } from "next/server";
import { getTicketsDb } from "@/lib/cloudflare-d1";
import { ensureShopSchema } from "@/lib/shop";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getTicketsDb();
  const token = process.env.PAYGATE_TOKEN;
  if (!db || !token) return new NextResponse("Paiement temporairement indisponible.", { status: 500 });
  await ensureShopSchema(db);
  const commande = await db.prepare(`select o.id, o.montant, o.payment_identifier, p.nom as produit_nom
    from shop_orders o join shop_products p on p.id = o.product_id where o.id = ?`).bind(Number(id)).first<{ id: number; montant: number; payment_identifier: string; produit_nom: string }>();
  if (!commande) return new NextResponse("Commande introuvable.", { status: 404 });
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const retour = `${protocol}://${host}/boutique/confirmation?commande=${commande.id}&identifier=${encodeURIComponent(commande.payment_identifier)}`;
  const url = `https://paygateglobal.com/v1/page?token=${encodeURIComponent(token)}&amount=${commande.montant}&identifier=${encodeURIComponent(commande.payment_identifier)}&description=${encodeURIComponent(`Commande boutique - ${commande.produit_nom}`)}&url=${encodeURIComponent(retour)}`;
  return NextResponse.redirect(url);
}
