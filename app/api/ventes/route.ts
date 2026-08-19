import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestAccess, type RequestAccess } from "@/lib/access-control";
import { ensureVentesSchema, getTicketsDb } from "@/lib/cloudflare-d1";

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

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

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
  const supabase = getSupabaseAdmin();

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

  const db = await getTicketsDb();

  if (!db) {
    return NextResponse.json(
      { message: "Base Cloudflare D1 non configuree." },
      { status: 500 }
    );
  }

  await ensureVentesSchema(db);

  let query;

  if (access.role === "client") {
    query = db
      .prepare("select * from ventes where owner_email = ? order by id desc")
      .bind(access.email);
  } else {
    query = db.prepare(
      "select * from ventes where owner_email is null order by id desc"
    );
  }

  const [{ results }, profils] = await Promise.all([
    query.all<Vente>(),
    getProfilsMap(access),
  ]);

  return NextResponse.json({
    ventes: (results || []).map((vente) => ({
      id: vente.id,
      montant: vente.montant,
      telephone: vente.telephone,
      statut: vente.statut,
      created_at: vente.created_at,
      profils: profils.get(vente.profil_id)
        ? { nom: profils.get(vente.profil_id)!.nom }
        : null,
    })),
  });
}