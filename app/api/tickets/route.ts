import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSession, verifyClientSession } from "@/lib/admin-session";
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
  return (
    (await verifyAdminSession(request.cookies.get("admin_session")?.value)) ||
    (await verifyClientSession(request.cookies.get("client_session")?.value))
  );
}

async function getProfilsMap() {
  const supabase = getSupabaseAdmin();

  if (!supabase) return new Map<number, Profil>();

  const { data } = await supabase
    .from("profils")
    .select("id, nom, prix, duree");

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
  if (!(await isAuthorized(request))) {
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
  const query = profilId
    ? db
        .prepare(
          "select id, profil_id, username, password, statut from tickets where profil_id = ? order by id desc limit 5000"
        )
        .bind(Number(profilId))
    : db.prepare(
        "select id, profil_id, username, password, statut from tickets order by id desc limit 5000"
      );

  const [{ results }, profils] = await Promise.all([
    query.all<D1Ticket>(),
    getProfilsMap(),
  ]);

  return NextResponse.json({
    tickets: (results || []).map((ticket) => withProfil(ticket, profils)),
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
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

  const statements = tickets.map((ticket) =>
    db
      .prepare(
        "insert or ignore into tickets (profil_id, username, password, statut) values (?, ?, ?, 'disponible')"
      )
      .bind(profilId, ticket.username, ticket.password)
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
  if (!(await isAuthorized(request))) {
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

  await db.prepare("delete from tickets where profil_id = ?").bind(profilId).run();

  return NextResponse.json({ ok: true });
}
