import { NextRequest, NextResponse } from "next/server";
import { getRequestAccess } from "@/lib/access-control";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const access = await getRequestAccess(request);
  if (!(access?.role === "admin" || (access?.role === "client" && access.emailVerified && access.statut === "actif"))) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });
  let query = supabase.from("tickets").select("profil_id, statut");
  query = access.role === "client" ? query.eq("owner_email", access.email) : query.is("owner_email", null);
  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  const grouped = new Map<string, { profil_id: number; statut: string; total: number }>();
  (data || []).forEach((ticket) => { const key = `${ticket.profil_id}:${ticket.statut}`; const row = grouped.get(key) || { profil_id: ticket.profil_id, statut: ticket.statut, total: 0 }; row.total += 1; grouped.set(key, row); });
  return NextResponse.json({ stats: Array.from(grouped.values()) });
}
