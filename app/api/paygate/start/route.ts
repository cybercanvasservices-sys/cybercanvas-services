import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildPaygateIdentifier } from "@/lib/paygate";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key) : null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { profilId?: number | string; phoneNumber?: string; network?: string };
    const profilId = Number(body.profilId);
    const phoneNumber = String(body.phoneNumber || "").replace(/\D/g, "");
    const network = String(body.network || "").toUpperCase();
    const token = process.env.PAYGATE_TOKEN;

    if (!profilId || phoneNumber.length < 8 || !["FLOOZ", "TMONEY"].includes(network)) {
      return NextResponse.json({ success: false, message: "Numéro ou réseau de paiement invalide." }, { status: 400 });
    }
    if (!token) return NextResponse.json({ success: false, message: "Configuration PayGate serveur manquante." }, { status: 500 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ success: false, message: "Configuration Supabase serveur manquante." }, { status: 500 });

    const { data: profil } = await supabase.from("profils").select("id, nom, prix").eq("id", profilId).single<{ id: number; nom: string; prix: number }>();
    if (!profil) return NextResponse.json({ success: false, message: "Profil WiFi introuvable." }, { status: 404 });

    const identifier = buildPaygateIdentifier(profil.id);
    const response = await fetch("https://paygateglobal.com/api/v1/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        phone_number: phoneNumber,
        amount: Number(profil.prix),
        description: `Ticket Wifi - ${profil.nom}`,
        identifier,
        network,
      }),
    });
    const data = (await response.json()) as { status?: number; tx_reference?: string; [key: string]: unknown };

    if (!response.ok || data.status !== 0) {
      return NextResponse.json({ success: false, message: "PayGate n’a pas pu lancer le paiement.", data }, { status: response.ok ? 400 : response.status });
    }

    return NextResponse.json({ success: true, identifier, txReference: data.tx_reference || null, data });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur lors du lancement du paiement." }, { status: 500 });
  }
}