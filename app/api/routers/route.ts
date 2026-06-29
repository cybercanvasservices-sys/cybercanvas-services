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

async function isAuthorized(request: NextRequest) {
  const access = await getRequestAccess(request);

  if (access?.role === "admin") {
    return access;
  }

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
  const access = await isAuthorized(request);

  if (!access) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        message:
          "Cle serveur Supabase manquante. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local.",
      },
      { status: 500 }
    );
  }

  const body = await request.json();
  const nom = String(body.nom || "").trim();
  const description = String(body.description || "").trim();
  const systeme = String(body.systeme || "MIKROTIK").trim();
  const dnsName = String(body.dns_name || "wifi.cybercanvas.local").trim();
  const adresse = String(body.adresse || "").trim();

  if (!nom || !description || !adresse) {
    return NextResponse.json(
      { message: "Libelle, description et adresse sont obligatoires." },
      { status: 400 }
    );
  }

  const token = `RTR-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}-${Date.now()}`;

  const fullPayload = {
    nom,
    description,
    systeme,
    dns_name: dnsName,
    adresse,
    owner_email: access.role === "client" ? access.email : null,
    token,
    statut: "offline",
    credits: 0,
  };

  let { data, error } = await supabase
    .from("routers")
    .insert([fullPayload])
    .select("*")
    .single();

  if (error) {
    const fallbackPayload = {
      nom,
      token,
      statut: "offline",
      credits: 0,
    };

    const fallback = await supabase
      .from("routers")
      .insert([fallbackPayload])
      .select("*")
      .single();

    data = fallback.data
      ? {
          ...fallback.data,
          description,
          systeme,
          dns_name: dnsName,
          adresse,
        }
      : null;
    error = fallback.error;
  }

  if (error || !data) {
    return NextResponse.json(
      { message: error?.message || "Erreur lors de l'ajout du routeur." },
      { status: 500 }
    );
  }

  return NextResponse.json({ routeur: data });
}

export async function GET(request: NextRequest) {
  const access = await isAuthorized(request);

  if (!access) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        message:
          "Cle serveur Supabase manquante. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local.",
      },
      { status: 500 }
    );
  }

  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    let query = supabase
      .from("routers")
      .select("*")
      .eq("id", id);

    if (access.role === "client") {
      query = query.eq("owner_email", access.email);
    }

    const { data, error } = await query.single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ routeur: data });
  }

  let query = supabase
    .from("routers")
    .select("*")
    .order("id", { ascending: false });

  if (access.role === "client") {
    query = query.eq("owner_email", access.email);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ routeurs: data || [] });
}

export async function PATCH(request: NextRequest) {
  const access = await isAuthorized(request);

  if (!access) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        message:
          "Cle serveur Supabase manquante. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local.",
      },
      { status: 500 }
    );
  }

  const body = await request.json();
  const id = body.id;
  const nom = String(body.nom || "").trim();
  const description = String(body.description || "").trim();
  const systeme = String(body.systeme || "MIKROTIK").trim();
  const dnsName = String(body.dns_name || "wifi.cybercanvas.local").trim();
  const adresse = String(body.adresse || "").trim();

  if (!id || !nom) {
    return NextResponse.json(
      { message: "Identifiant et libelle obligatoires." },
      { status: 400 }
    );
  }

  const fullPayload = {
    nom,
    description,
    systeme,
    dns_name: dnsName,
    adresse,
  };

  let updateQuery = supabase
    .from("routers")
    .update(fullPayload)
    .eq("id", id);

  if (access.role === "client") {
    updateQuery = updateQuery.eq("owner_email", access.email);
  }

  let { data, error } = await updateQuery.select("*").single();

  if (error) {
    let fallbackQuery = supabase
      .from("routers")
      .update({ nom })
      .eq("id", id);

    if (access.role === "client") {
      fallbackQuery = fallbackQuery.eq("owner_email", access.email);
    }

    const fallback = await fallbackQuery.select("*").single();

    data = fallback.data
      ? {
          ...fallback.data,
          description,
          systeme,
          dns_name: dnsName,
          adresse,
        }
      : null;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ routeur: data });
}

export async function DELETE(request: NextRequest) {
  const access = await isAuthorized(request);

  if (!access) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        message:
          "Cle serveur Supabase manquante. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local.",
      },
      { status: 500 }
    );
  }

  const body = await request.json();
  const id = body.id;

  if (!id) {
    return NextResponse.json(
      { message: "Identifiant routeur manquant." },
      { status: 400 }
    );
  }

  let deleteQuery = supabase.from("routers").delete().eq("id", id);

  if (access.role === "client") {
    deleteQuery = deleteQuery.eq("owner_email", access.email);
  }

  const { error } = await deleteQuery;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
