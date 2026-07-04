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
  details: {
    routeurs: RouterDetail[];
    profils: ProfilDetail[];
    ventesRecentes: VenteDetail[];
  };
};

type OwnerRow = {
  owner_email: string | null;
};

type RouterRow = OwnerRow & {
  id?: number | null;
  nom?: string | null;
  description?: string | null;
  systeme?: string | null;
  dns_name?: string | null;
  adresse?: string | null;
  statut?: string | null;
  credits?: number | null;
};

type VenteRow = OwnerRow & {
  id?: number | null;
  montant?: number | null;
  telephone?: string | null;
  statut?: string | null;
  created_at?: string | null;
  profils?: {
    nom?: string | null;
  } | null;
};

type TicketStatRow = {
  owner_email: string | null;
  profil_id: number | null;
  statut: string | null;
  total: number;
};

type ProfilRow = OwnerRow & {
  id: number;
  nom: string | null;
  prix: number | null;
  duree: string | null;
  slug: string | null;
};

type RouterDetail = {
  id: number | null;
  nom: string;
  systeme: string;
  dnsName: string;
  adresse: string;
  statut: string;
  credits: number;
};

type ProfilDetail = {
  id: number;
  nom: string;
  prix: number;
  duree: string;
  slug: string;
  ticketsDisponibles: number;
  ticketsVendus: number;
  revenus: number;
  ventes: number;
};

type VenteDetail = {
  id: number | null;
  profil: string;
  montant: number;
  telephone: string;
  statut: string;
  createdAt: string | null;
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
    details: {
      routeurs: [],
      profils: [],
      ventesRecentes: [],
    },
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
      supabase
        .from("routers")
        .select("id, owner_email, nom, description, systeme, dns_name, adresse, statut, credits"),
      supabase
        .from("profils")
        .select("id, owner_email, nom, prix, duree, slug"),
      supabase
        .from("ventes")
        .select("id, owner_email, montant, telephone, statut, created_at, profils ( nom )"),
    ]);

  const profilOwnerById = new Map<number, string>();
  const profilDetailById = new Map<number, ProfilDetail>();

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

    summary.details.routeurs.push({
      id: routeur.id ?? null,
      nom: routeur.nom || "Routeur sans nom",
      systeme: routeur.systeme || "MIKROTIK",
      dnsName: routeur.dns_name || "-",
      adresse: routeur.adresse || "-",
      statut: routeur.statut || "offline",
      credits: Number(routeur.credits || 0),
    });
  });

  ((profils || []) as ProfilRow[]).forEach((profil) => {
    const summary = getSummary(summaries, profil.owner_email || "");
    if (!summary) return;

    summary.profils += 1;
    profilOwnerById.set(profil.id, summary.email);

    const detail = {
      id: profil.id,
      nom: profil.nom || "Profil sans nom",
      prix: Number(profil.prix || 0),
      duree: profil.duree || "-",
      slug: profil.slug || "",
      ticketsDisponibles: 0,
      ticketsVendus: 0,
      revenus: 0,
      ventes: 0,
    };

    profilDetailById.set(profil.id, detail);
    summary.details.profils.push(detail);
  });

  ((ventes || []) as VenteRow[]).forEach((vente) => {
    const summary = getSummary(summaries, vente.owner_email || "");
    if (!summary) return;

    const montant = Number(vente.montant || 0);
    summary.ventes += 1;
    summary.revenus += montant;
    updateLastActivity(summary, vente.created_at);

    const profilName = vente.profils?.nom || "Profil inconnu";
    const profilDetail = summary.details.profils.find(
      (profil) => profil.nom === profilName
    );

    if (profilDetail) {
      profilDetail.ventes += 1;
      profilDetail.revenus += montant;
    }

    summary.details.ventesRecentes.push({
      id: vente.id ?? null,
      profil: profilName,
      montant,
      telephone: vente.telephone || "-",
      statut: vente.statut || "paye",
      createdAt: vente.created_at || null,
    });
  });

  const db = await getTicketsDb();

  if (db) {
    const { results } = await db
      .prepare(
        `select owner_email, profil_id, statut, count(*) as total
         from tickets
         group by owner_email, profil_id, statut`
      )
      .all<TicketStatRow>();

    (results || []).forEach((row) => {
      const ownerEmail =
        normalizeEmail(row.owner_email) ||
        (row.profil_id ? profilOwnerById.get(Number(row.profil_id)) : "") ||
        "";
      const summary = getSummary(summaries, ownerEmail);
      if (!summary) return;

      const total = Number(row.total || 0);
      const statut = String(row.statut || "").toLowerCase();
      const profilDetail = row.profil_id
        ? profilDetailById.get(Number(row.profil_id))
        : null;

      if (statut === "vendu") {
        summary.ticketsVendus += total;
        if (profilDetail) profilDetail.ticketsVendus += total;
      } else {
        summary.ticketsDisponibles += total;
        if (profilDetail) profilDetail.ticketsDisponibles += total;
      }
    });
  }

  summaries.forEach((summary) => {
    summary.commission = Math.round(summary.revenus * COMMISSION_RATE);
    summary.net = Math.max(summary.revenus - summary.commission, 0);
    summary.details.ventesRecentes = summary.details.ventesRecentes
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 8);
  });

  return NextResponse.json({
    activities: Array.from(summaries.values()).sort((a, b) =>
      a.email.localeCompare(b.email)
    ),
  });
}
