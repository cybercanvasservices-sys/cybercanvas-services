import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";
import { getTicketsDb } from "@/lib/cloudflare-d1";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

type ActivitySummary = {
  email: string;
  routeurs: number;
  routeursOnline: number;
  profils: number;
  ticketsDisponibles: number;
  ticketsVendus: number;
  ventes: number;
  revenus: number;
  commission: number;
  net: number;
  derniereActivite: string | null;
};

type OwnerRow = {
  owner_email: string | null;
};

type RouterRow = OwnerRow & {
  statut?: string | null;
};

type VenteRow = OwnerRow & {
  montant?: number | null;
  created_at?: string | null;
};

type TicketStatRow = {
  owner_email: string | null;
  statut: string | null;
  total: number;
};

const COMMISSION_RATE = 0.1;

function emptySummary(email: string): ActivitySummary {
  return {
    email,
    routeurs: 0,
    routeursOnline: 0,
    profils: 0,
    ticketsDisponibles: 0,
    ticketsVendus: 0,
    ventes: 0,
    revenus: 0,
    commission: 0,
    net: 0,
    derniereActivite: null,
  };
}

function normalizeEmail(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function getSummary(map: Map<string, ActivitySummary>, email: string) {
  const key = normalizeEmail(email);

  if (!key) return null;

  if (!map.has(key)) {
    map.set(key, emptySummary(key));
  }

  return map.get(key) || null;
}

function updateLastActivity(summary: ActivitySummary, value: string | null | undefined) {
  if (!value) return;

  if (!summary.derniereActivite) {
    summary.derniereActivite = value;
    return;
  }

  if (new Date(value).getTime() > new Date(summary.derniereActivite).getTime()) {
    summary.derniereActivite = value;
  }
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminSession(
    request.cookies.get("admin_session")?.value
  );

  if (!isAdmin) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  const summaries = new Map<string, ActivitySummary>();

  const [{ data: clients }, { data: routeurs }, { data: profils }, { data: ventes }] =
    await Promise.all([
      supabase.from("clients").select("email"),
      supabase.from("routers").select("owner_email, statut"),
      supabase.from("profils").select("owner_email"),
      supabase.from("ventes").select("owner_email, montant, created_at"),
    ]);

  (clients || []).forEach((client: { email?: string | null }) => {
    getSummary(summaries, client.email || "");
  });

  ((routeurs || []) as RouterRow[]).forEach((routeur) => {
    const summary = getSummary(summaries, routeur.owner_email || "");
    if (!summary) return;

    summary.routeurs += 1;
    if (String(routeur.statut || "").toLowerCase() === "online") {
      summary.routeursOnline += 1;
    }
  });

  ((profils || []) as OwnerRow[]).forEach((profil) => {
    const summary = getSummary(summaries, profil.owner_email || "");
    if (!summary) return;

    summary.profils += 1;
  });

  ((ventes || []) as VenteRow[]).forEach((vente) => {
    const summary = getSummary(summaries, vente.owner_email || "");
    if (!summary) return;

    const montant = Number(vente.montant || 0);
    summary.ventes += 1;
    summary.revenus += montant;
    updateLastActivity(summary, vente.created_at);
  });

  const db = await getTicketsDb();

  if (db) {
    const { results } = await db
      .prepare(
        `select owner_email, statut, count(*) as total
         from tickets
         group by owner_email, statut`
      )
      .all<TicketStatRow>();

    (results || []).forEach((row) => {
      const summary = getSummary(summaries, row.owner_email || "");
      if (!summary) return;

      const total = Number(row.total || 0);
      const statut = String(row.statut || "").toLowerCase();

      if (statut === "vendu") {
        summary.ticketsVendus += total;
      } else {
        summary.ticketsDisponibles += total;
      }
    });
  }

  summaries.forEach((summary) => {
    summary.commission = Math.round(summary.revenus * COMMISSION_RATE);
    summary.net = Math.max(summary.revenus - summary.commission, 0);
  });

  return NextResponse.json({
    activities: Array.from(summaries.values()).sort((a, b) =>
      a.email.localeCompare(b.email)
    ),
  });
}
