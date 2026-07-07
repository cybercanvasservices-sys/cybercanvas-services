import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRequestAccess } from "@/lib/access-control";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const access = await getRequestAccess(request);

  if (
    !(
      access?.role === "admin" ||
      (access?.role === "client" &&
        access.emailVerified &&
        access.statut === "actif")
    )
  ) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  let query = supabase
    .from("ventes")
    .select(
      `
      *,
      profils (
        nom
      )
    `
    )
    .order("id", { ascending: false });

  if (access.role === "client") {
    query = query.eq("owner_email", access.email);
  } else {
    query = query.is("owner_email", null);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ventes: data || [] });
}
