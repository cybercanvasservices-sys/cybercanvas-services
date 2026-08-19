import { NextRequest, NextResponse } from "next/server";
import { getRequestAccess, type RequestAccess } from "@/lib/access-control";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

type Profil = {
  id: number;
  nom: string;
  prix: number;
  duree: string;
};

type TicketRow = {
  id: number;
  profil_id: number;
  owner_email: string | null;
  username: string;
  password: string;
  statut: string;
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

  let query = supabase
    .from("profils")
    .select("id, nom, prix, duree");

  if (access?.role === "client") {
    query = query.eq("owner_email", access.email);
  } else {
    query = query.is("owner_email", null);
  }

  const { data } = await query;

  return new Map((data || []).map((profil) => [profil.id, profil as Profil]));
}

function withProfil(ticket: TicketRow, profils: Map<number, Profil>) {
  return {
    id: ticket.id,
    username: ticket.username,
    password: ticket.password,
    statut: ticket.statut,
    profils: profils.get(ticket.profil_id) || null,
  };
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

  const profilId = request.nextUrl.searchParams.get("profil_id");

  let query = supabase
    .from("tickets")
    .select("id, profil_id, owner_email, username, password, statut")
    .order("id", { ascending: false })
    .limit(5000);

  if (access.role === "client") {
    query = query.eq("owner_email", access.email);
  } else {
    query = query.is("owner_email", null);
  }

  if (profilId) {
    query = query.eq("profil_id", Number(profilId));
  }

  const [{ data: results }, profils] = await Promise.all([
    query,
    getProfilsMap(access),
  ]);

  return NextResponse.json({
    tickets: (results || []).map((ticket) =>
      withProfil(ticket as TicketRow, profils)
    ),
  });
}

export async function POST(request: NextRequest) {
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

  const body = (await request.json()) as {
    profil_id?: number;
    tickets?: { username?: string; password?: string }[];
  };
  const profilId = Number(body.profil_id);
  const tickets = (body.tickets || [])
    .map((ticket) => ({
      username: String(ticket.username || "").trim(),
      password: String(ticket.password || "").trim(),
    }))
    .filter((ticket) => ticket.username && ticket.password);

  if (!profilId || tickets.length === 0) {
    return NextResponse.json(
      { message: "Profil et tickets obligatoires." },
      { status: 400 }
    );
  }

  if (access.role === "client" && !(await clientOwnsProfil(access.email, profilId))) {
    return NextResponse.json({ message: "Profil non autorise." }, { status: 403 });
  }

  if (access.role === "admin" && !(await adminOwnsProfil(profilId))) {
    return NextResponse.json({ message: "Profil administrateur non autorise." }, { status: 403 });
  }

  const rows = tickets.map((ticket) => ({
    profil_id: profilId,
    owner_email: access.role === "client" ? access.email : null,
    username: ticket.username,
    password: ticket.password,
    statut: "disponible",
  }));

  const { error } = await supabase
    .from("tickets")
    .upsert(rows, { onConflict: "profil_id,username", ignoreDuplicates: true });

  if (error) {
    return NextResponse.json(
      { message: "Erreur lors de l import des tickets." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `${tickets.length} ticket(s) importes.`,
    count: tickets.length,
  });
}

export async function DELETE(request: NextRequest) {
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

  const body = (await request.json()) as { profil_id?: number };
  const profilId = Number(body.profil_id);

  if (!profilId) {
    return NextResponse.json(
      { message: "Profil obligatoire." },
      { status: 400 }
    );
  }

  let query = supabase.from("tickets").delete().eq("profil_id", profilId);

  if (access.role === "client") {
    query = query.eq("owner_email", access.email);
  } else {
    query = query.is("owner_email", null);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json(
      { message: "Erreur lors de la suppression des tickets." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

async function adminOwnsProfil(profilId: number) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) return false;

  const { data } = await supabase
    .from("profils")
    .select("id")
    .eq("id", profilId)
    .is("owner_email", null)
    .maybeSingle();

  return Boolean(data);
}

async function clientOwnsProfil(email: string, profilId: number) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) return false;

  const { data } = await supabase
    .from("profils")
    .select("id")
    .eq("id", profilId)
    .eq("owner_email", email)
    .maybeSingle();

  return Boolean(data);
}