import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";
import { hashPassword } from "@/lib/passwords";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

async function isAdmin(request: NextRequest) {
  return verifyAdminSession(request.cookies.get("admin_session")?.value);
}

function clean(value: unknown) {
  return String(value || "").trim();
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, nom, entreprise, email, telephone, ville, statut, discussion, photo, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const nom = clean(body.nom);
  const email = clean(body.email).toLowerCase();
  const telephone = clean(body.telephone);
  const password = String(body.password || "");

  if (!nom || !email || !telephone || !password) {
    return NextResponse.json(
      { message: "Nom, telephone, email et mot de passe sont obligatoires." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { message: "Le mot de passe doit contenir au moins 8 caracteres." },
      { status: 400 }
    );
  }

  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingClient) {
    return NextResponse.json(
      { message: "Une demande existe deja avec cette adresse email." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("clients").insert({
    nom,
    email,
    telephone,
    entreprise: clean(body.entreprise) || "Non renseignee",
    ville: clean(body.ville) || "Non renseignee",
    statut: "en_attente",
    discussion: false,
    password_hash: await hashPassword(password),
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message:
      "Votre demande a ete envoyee. Votre compte doit etre valide par l'administrateur avant connexion.",
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const id = Number(body.id);

  if (!id) {
    return NextResponse.json(
      { message: "Identifiant client manquant." },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {};

  for (const field of ["nom", "entreprise", "email", "telephone", "ville", "photo"]) {
    if (field in body) payload[field] = clean(body[field]);
  }

  if ("statut" in body) {
    payload.statut = clean(body.statut);
    if (payload.statut !== "actif") {
      payload.discussion = false;
    }
  }

  if ("discussion" in body) {
    payload.discussion = Boolean(body.discussion);
  }

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select("id, nom, entreprise, email, telephone, ville, statut, discussion, photo, created_at")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ client: data });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const id = Number(body.id);

  if (!id) {
    return NextResponse.json(
      { message: "Identifiant client manquant." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
