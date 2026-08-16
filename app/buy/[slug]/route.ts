import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Props = { params: Promise<{ slug: string }> };

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key) : null;
}

function getRequestOrigin(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return new NextResponse("Configuration Supabase serveur manquante.", { status: 500 });

  const { data: profil } = await supabase.from("profils").select("id").eq("slug", slug).single<{ id: number }>();
  if (!profil) return new NextResponse("Profil introuvable.", { status: 404 });

  return NextResponse.redirect(`${getRequestOrigin(request)}/paygate?profil=${profil.id}`);
}