import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestAccess } from "@/lib/access-control";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET(request: NextRequest) {
  const access = await getAuthorizedAccess(request);

  if (!access) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Cle serveur Supabase manquante." },
      { status: 500 }
    );
  }

  let query = supabase
    .from("profils")
    .select("id, nom, prix, duree, slug, owner_email")
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

  return NextResponse.json({ profils: data || [] });
}

async function getAuthorizedAccess(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  const access = await getAuthorizedAccess(request);

  if (!access) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Cle serveur Supabase manquante." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const nom = String(body.nom || "").trim();
  const prix = Number(body.prix);
  const duree = String(body.duree || "").trim();

  if (!nom || !prix || !duree) {
    return NextResponse.json(
      { message: "Nom, prix et duree obligatoires." },
      { status: 400 }
    );
  }

  const slug = `${nom.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

  const { data, error } = await supabase
    .from("profils")
    .insert([
      {
        nom,
        prix,
        duree,
        slug,
        owner_email: access.role === "client" ? access.email : null,
      },
    ])
    .select("id, nom, prix, duree, slug, owner_email")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ profil: data });
}

export async function PATCH(request: NextRequest) {
  const access = await getAuthorizedAccess(request);

  if (!access) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Cle serveur Supabase manquante." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const id = Number(body.id);
  const nom = String(body.nom || "").trim();
  const prix = Number(body.prix);
  const duree = String(body.duree || "").trim();

  if (!id || !nom || !prix || !duree) {
    return NextResponse.json(
      { message: "Identifiant, nom, prix et duree obligatoires." },
      { status: 400 }
    );
  }

  let query = supabase
    .from("profils")
    .update({ nom, prix, duree })
    .eq("id", id);

  if (access.role === "client") {
    query = query.eq("owner_email", access.email);
  } else {
    query = query.is("owner_email", null);
  }

  const { data, error } = await query
    .select("id, nom, prix, duree, slug, owner_email")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ profil: data });
}

export async function DELETE(request: NextRequest) {
  const access = await getAuthorizedAccess(request);

  if (!access) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Cle serveur Supabase manquante." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const id = Number(body.id);

  if (!id) {
    return NextResponse.json(
      { message: "Identifiant profil manquant." },
      { status: 400 }
    );
  }

  let query = supabase.from("profils").delete().eq("id", id);

  if (access.role === "client") {
    query = query.eq("owner_email", access.email);
  } else {
    query = query.is("owner_email", null);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
