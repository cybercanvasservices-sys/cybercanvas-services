import { NextRequest, NextResponse } from "next/server";
import { getRequestAccess } from "@/lib/access-control";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

type TicketStat = {
  profil_id: number;
  statut: string;
  total: number;
};

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

  let query = supabase.from("tickets").select("profil_id, statut");

  if (access.role === "client") {
    query = query.eq("owner_email", access.email);
  } else {
    query = query.is("owner_email", null);
  }

  const { data } = await query;

  const stats = new Map<string, TicketStat>();

  (data || []).forEach((row) => {
    const key = `${row.profil_id}:${row.statut}`;
    const current = stats.get(key) || {
      profil_id: row.profil_id,
      statut: row.statut,
      total: 0,
    };
    current.total += 1;
    stats.set(key, current);
  });

  return NextResponse.json({ stats: Array.from(stats.values()) });
}