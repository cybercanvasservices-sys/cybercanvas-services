import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRequestAccess, type RequestAccess } from "@/lib/access-control";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

type Vente = {
  id: number;
  profil_id: number;
  ticket_id: number;
  montant: number;
  telephone: string;
  statut: string;
  owner_email: string | null;
  sale_identifier: string;
  created_at: string;
};

type Profil = {
  id: number;
  nom: string;
};

async function isAuthorized(request: NextRequest) {
  const access = await getRequestAccess(request);

  if (access?.role === "admin") return access;

  if (
    access?.role === "client" &&
    access.emailVerified &&
    access.statut === "actif"
  ) {
    return access;
  }

  return null;
}

async function getProfilsMap(access: RequestAccess) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) return new Map<number, Profil>();

  let query = supabase.from("profils").select("id, nom");

  if (access?.role === "client") {
    query = query.eq("owner_email", access.email);
  } else {
    query = query.is("owner_email", null);
  }

  const { data } = await query;

  return new Map((data || []).map((profil) => [profil.id, profil as Profil]));
}

export async function GET(request: NextRequest) {
  const access = await isAuthorized(request);

  if (!access) {
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
    .select("id, profil_id, ticket_id, montant, telephone, statut, owner_email, sale_identifier, created_at")
    .order("id", { ascending: false });

  if (access.role === "client") {
    query = query.eq("owner_email", access.email);
  } else {
    query = query.is("owner_email", null);
  }

  const [{ data: results }, profils] = await Promise.all([
    query,
    getProfilsMap(access),
  ]);

  return NextResponse.json({
    ventes: (results || []).map((vente) => {
      const v = vente as Vente;
      const profil = profils.get(v.profil_id);

      return {
        id: v.id,
        montant: v.montant,
        telephone: v.telephone,
        statut: v.statut,
        created_at: v.created_at,
        profils: profil ? { nom: profil.nom } : null,
      };
    }),
  });
}