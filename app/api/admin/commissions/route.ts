import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

type VenteRow = {
  id: number;
  montant?: number | null;
  telephone?: string | null;
  statut?: string | null;
  created_at?: string | null;
  owner_email?: string | null;
  profils?: { nom?: string | null; prix?: number | null } | null;
};

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminSession(request.cookies.get("admin_session")?.value);
  if (!isAdmin) return NextResponse.json({ message: "Non autorise." }, { status: 401 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });

  const { data, error } = await supabase
    .from("ventes")
    .select("id, montant, telephone, statut, created_at, owner_email, profils ( nom, prix )")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const commissions = ((data || []) as VenteRow[]).map((vente) => {
    const prix = Number(vente.profils?.prix || 0);
    const commission = Math.round(prix * 0.1);
    return {
      id: vente.id,
      profil: vente.profils?.nom || "Profil inconnu",
      client: vente.telephone || "-",
      proprietaire: vente.owner_email || "-",
      prix,
      commission,
      proprietaireNet: Math.max(prix - commission, 0),
      statut: vente.statut || "paye",
      created_at: vente.created_at || null,
    };
  });

  return NextResponse.json({
    commissions,
    total: commissions.reduce((sum, vente) => sum + vente.commission, 0),
  });
}