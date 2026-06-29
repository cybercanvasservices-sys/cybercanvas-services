import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestAccess, type RequestAccess } from "@/lib/access-control";
import { getTicketsDb } from "@/lib/cloudflare-d1";

type Profil = {
  id: number;
  nom: string;
  prix: number;
  duree: string;
};

type D1Ticket = {
  id: number;
  profil_id: number;
  owner_email: string | null;
  username: string;
  password: string;
  statut: string;
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

  let query = supabase
    .from("profils")
    .select("id, nom, prix, duree");

  if (access?.role === "client") {
    query = query.eq("owner_email", access.email);
  }

  const { data } = await query;

  return new Map((data || []).map((profil) => [profil.id, profil as Profil]));
}

function withProfil(ticket: D1Ticket, profils: Map<number, Profil>) {
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

  const db = await getTicketsDb();

  if (!db) {
    return NextResponse.json(
      { message: "Base Cloudflare D1 non configuree." },
      { status: 500 }
    );
  }

  const profilId = request.nextUrl.searchParams.get("profil_id");
  let query;

  if (access.role === "client" && profilId) {
    query = db
      .prepare(
        "select id, profil_id, owner_email, username, password, statut from tickets where profil_id = ? and owner_email = ? order by id desc limit 5000"
      )
      .bind(Number(profilId), access.email);
  } else if (access.role === "client") {
    query = db
      .prepare(
        "select id, profil_id, owner_email, username, password, statut from tickets where owner_email = ? order by id desc limit 5000"
      )
      .bind(access.email);
  } else if (profilId) {
    query = db
      .prepare(
        "select id, profil_id, owner_email, username, password, statut from tickets where profil_id = ? order by id desc limit 5000"
      )
      .bind(Number(profilId));
  } else {
    query = db.prepare(
      "select id, profil_id, owner_email, username, password, statut from tickets order by id desc limit 5000"
    );
  }

  const [{ results }, profils] = await Promise.all([
    query.all<D1Ticket>(),
    getProfilsMap(access),
  ]);

  return NextResponse.json({
    tickets: (results || []).map((ticket) => withProfil(ticket, profils)),
  });
}

export async function POST(request: NextRequest) {
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

  const statements = tickets.map((ticket) =>
    db
      .prepare(
        "insert or ignore into tickets (profil_id, owner_email, username, password, statut) values (?, ?, ?, ?, 'disponible')"
      )
      .bind(profilId, access.role === "client" ? access.email : null, ticket.username, ticket.password)
  );

  if (db.batch) {
    await db.batch(statements);
  } else {
    for (const statement of statements) {
      await statement.run();
    }
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

  const db = await getTicketsDb();

  if (!db) {
    return NextResponse.json(
      { message: "Base Cloudflare D1 non configuree." },
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

  if (access.role === "client") {
    await db
      .prepare("delete from tickets where profil_id = ? and owner_email = ?")
      .bind(profilId, access.email)
      .run();
  } else {
    await db.prepare("delete from tickets where profil_id = ?").bind(profilId).run();
  }

  return NextResponse.json({ ok: true });
}

async function clientOwnsProfil(email: string, profilId: number) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return false;

  const { data } = await supabase
    .from("profils")
    .select("id")
    .eq("id", profilId)
    .eq("owner_email", email)
    .maybeSingle();

  return Boolean(data);
}
