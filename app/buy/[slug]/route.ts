import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildPaygateIdentifier } from "@/lib/paygate";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

type Profil = {
  id: number;
  nom: string;
  prix: number;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function getRequestOrigin(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3000";
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol =
    forwardedProto || (host.includes("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const paygateToken = process.env.PAYGATE_TOKEN;

  if (!supabase) {
    return new NextResponse("Configuration Supabase serveur manquante.", {
      status: 500,
    });
  }

  if (!paygateToken) {
    return new NextResponse("Configuration PayGate serveur manquante.", {
      status: 500,
    });
  }

  const { data: profil } = await supabase
    .from("profils")
    .select("id, nom, prix")
    .eq("slug", slug)
    .single<Profil>();

  if (!profil) {
    return new NextResponse("Profil introuvable.", { status: 404 });
  }

  const origin = getRequestOrigin(request);
  const identifier = buildPaygateIdentifier(profil.id);
  const description = `Ticket Wifi - ${profil.nom}`;
  const retour =
    `${origin}/payer?profil=${profil.id}` +
    `&identifier=${encodeURIComponent(identifier)}`;

  const paygateUrl =
    `https://paygateglobal.com/v1/page` +
    `?token=${encodeURIComponent(paygateToken)}` +
    `&amount=${profil.prix}` +
    `&identifier=${encodeURIComponent(identifier)}` +
    `&description=${encodeURIComponent(description)}` +
    `&url=${encodeURIComponent(retour)}`;

  return NextResponse.redirect(paygateUrl);
}
