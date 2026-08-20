import { NextRequest, NextResponse } from "next/server";
import { getRequestAccess } from "@/lib/access-control";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

const RETRAIT_MINIMUM = 2000;
type RetraitStatus = "en_attente" | "valide" | "refuse";

function clean(value: unknown) {
  return String(value || "").trim();
}

function isActiveClient(access: Awaited<ReturnType<typeof getRequestAccess>>) {
  return (
    access?.role === "client" &&
    access.emailVerified &&
    access.statut === "actif"
  );
}

function calculateAmounts(montant: number) {
  return { commission: 0, net: Math.max(montant, 0) };
}

export async function GET(request: NextRequest) {
  const access = await getRequestAccess(request);

  if (!(access?.role === "admin" || isActiveClient(access))) {
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
    .from("retraits")
    .select("*")
    .order("created_at", { ascending: false });

  if (access?.role === "client") {
    query = query.eq("owner_email", access.email);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      {
        message:
          error.code === "42P01"
            ? "Table retraits manquante. Creez la table Supabase retraits."
            : error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ retraits: data || [] });
}

export async function POST(request: NextRequest) {
  const access = await getRequestAccess(request);

  if (!isActiveClient(access) || access?.role !== "client") {
    return NextResponse.json(
      { message: "Votre compte doit etre actif pour demander un retrait." },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const montant = Number(body.montant);
  const numeroPaiementSaisi = clean(body.numero_paiement);
  const routeurId = clean(body.routeur_id);

  if (!montant || montant < RETRAIT_MINIMUM) {
    return NextResponse.json(
      { message: `Le retrait minimum est de ${RETRAIT_MINIMUM} FCFA.` },
      { status: 400 }
    );
  }

  if (!routeurId) {
    return NextResponse.json(
      { message: "Choisissez le Cyber concerne par ce retrait." },
      { status: 400 }
    );
  }

  let cyberQuery = supabase
    .from("routers")
    .select("id, numero_retrait")
    .eq("id", routeurId);
  cyberQuery = cyberQuery.eq("owner_email", access.email);
  const { data: cyber, error: cyberError } = await cyberQuery.maybeSingle();

  if (cyberError || !cyber) {
    return NextResponse.json(
      { message: "Cyber introuvable ou non autorise." },
      { status: 400 }
    );
  }

  const numeroPaiement = numeroPaiementSaisi || clean(cyber.numero_retrait);
  if (!numeroPaiement) {
    return NextResponse.json(
      { message: "Ajoutez le numero de retrait dans Mes Cybers." },
      { status: 400 }
    );
  }

  const { commission, net } = calculateAmounts(montant);

  const { data: client } = await supabase
    .from("clients")
    .select("nom, telephone")
    .eq("email", access.email)
    .maybeSingle();

  const { data, error } = await supabase
    .from("retraits")
    .insert([
      {
        owner_email: access.email,
        client_nom: client?.nom || access.email,
        client_telephone: client?.telephone || "",
        numero_paiement: numeroPaiement,
        routeur_id: routeurId,
        montant,
        commission,
        net,
        statut: "en_attente",
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        message:
          error.code === "42P01"
            ? "Table retraits manquante. Creez la table Supabase retraits."
            : error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ retrait: data });
}

export async function PATCH(request: NextRequest) {
  const access = await getRequestAccess(request);

  if (access?.role !== "admin") {
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
  const statut = clean(body.statut) as RetraitStatus;
  const noteAdmin = clean(body.note_admin);

  if (!id || !["en_attente", "valide", "refuse"].includes(statut)) {
    return NextResponse.json(
      { message: "Identifiant ou statut invalide." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("retraits")
    .update({
      statut,
      note_admin: noteAdmin || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ retrait: data });
}
