import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";
import { ensureVentesSchema, getTicketsDb } from "@/lib/cloudflare-d1";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

type Vente = {
  id: number;
  profil_id: number;
  montant: number;
  telephone: string;
  statut: string;
  owner_email: string | null;
  created_at: string;
};

type Profil = {
  id: number;
  nom: string;
  prix: number;
};

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminSession(request.cookies.get("admin_session")?.value);
  if (!isAdmin) return NextResponse.json({ message: "Non autorise." }, { status: 401 });

  const db = await getTicketsDb();
  if (!db) return NextResponse.json({ message: "Base Cloudflare D1 non configuree." }, { status: 500 });
  await ensureVentesSchema(db);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });

  const [{ results }, { data: profils }] = await Promise.all([
    db.prepare("select id, profil_id, montant, telephone, statut, owner_email, created_at from ventes order by created_at desc").all<Vente>(),
    supabase.from("profils").select("id, nom, prix"),
  ]);

  const profilsById = new Map((profils || []).map((profil) => [profil.id, profil as Profil]));

  const commissions = ((results || []) as Vente[]).map((vente) => {
    const profil = profilsById.get(vente.profil_id);
    const prix = Number(profil?.prix || 0);
    const commission = Math.round(prix * 0.1);

    return {
      id: vente.id,
      profil: profil?.nom || "Profil inconnu",
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