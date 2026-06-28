import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSession, verifyClientSession } from "@/lib/admin-session";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET(request: NextRequest) {
  const authorized =
    (await verifyAdminSession(request.cookies.get("admin_session")?.value)) ||
    (await verifyClientSession(request.cookies.get("client_session")?.value));

  if (!authorized) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Cle serveur Supabase manquante." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("profils")
    .select("id, nom, prix, duree, slug")
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ profils: data || [] });
}
