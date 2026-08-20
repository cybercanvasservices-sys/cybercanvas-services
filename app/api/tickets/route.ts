import { NextRequest, NextResponse } from "next/server";
import { getRequestAccess, type RequestAccess } from "@/lib/access-control";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

type Profil = { id: number; nom: string; prix: number; duree: string };
type Ticket = { id: number; profil_id: number; owner_email: string | null; username: string; password: string; statut: string };

async function authorized(request: NextRequest) {
  const access = await getRequestAccess(request);
  return access?.role === "admin" || (access?.role === "client" && access.emailVerified && access.statut === "actif") ? access : null;
}

async function profiles(access: Exclude<RequestAccess, null>) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return new Map<number, Profil>();
  let query = supabase.from("profils").select("id, nom, prix, duree");
  query = access.role === "client" ? query.eq("owner_email", access.email) : query.is("owner_email", null);
  const { data } = await query;
  return new Map((data || []).map((profile) => [profile.id, profile as Profil]));
}

async function ownsProfile(access: Exclude<RequestAccess, null>, profilId: number) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;
  let query = supabase.from("profils").select("id").eq("id", profilId);
  query = access.role === "client" ? query.eq("owner_email", access.email) : query.is("owner_email", null);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function GET(request: NextRequest) {
  const access = await authorized(request);
  if (!access) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });
  const profilId = request.nextUrl.searchParams.get("profil_id");
  let query = supabase.from("tickets").select("id, profil_id, owner_email, username, password, statut").order("id", { ascending: false }).limit(5000);
  query = access.role === "client" ? query.eq("owner_email", access.email) : query.is("owner_email", null);
  if (profilId) query = query.eq("profil_id", Number(profilId));
  const [{ data, error }, profilMap] = await Promise.all([query, profiles(access)]);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ tickets: ((data || []) as Ticket[]).map((ticket) => ({ id: ticket.id, username: ticket.username, password: ticket.password, statut: ticket.statut, profils: profilMap.get(ticket.profil_id) || null })) });
}

export async function POST(request: NextRequest) {
  const access = await authorized(request);
  if (!access) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });
  const body = (await request.json()) as { profil_id?: number; tickets?: { username?: string; password?: string }[] };
  const profilId = Number(body.profil_id);
  const tickets = (body.tickets || []).map((ticket) => ({ username: String(ticket.username || "").trim(), password: String(ticket.password || "").trim() })).filter((ticket) => ticket.username && ticket.password);
  if (!profilId || tickets.length === 0) return NextResponse.json({ message: "Profil et tickets obligatoires." }, { status: 400 });
  if (!(await ownsProfile(access, profilId))) return NextResponse.json({ message: "Profil non autorisé." }, { status: 403 });
  const { error } = await supabase.from("tickets").upsert(tickets.map((ticket) => ({ profil_id: profilId, owner_email: access.role === "client" ? access.email : null, username: ticket.username, password: ticket.password, statut: "disponible" })), { onConflict: "profil_id,username", ignoreDuplicates: true });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: `${tickets.length} ticket(s) importé(s).`, count: tickets.length });
}

export async function DELETE(request: NextRequest) {
  const access = await authorized(request);
  if (!access) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Configuration Supabase serveur manquante." }, { status: 500 });
  const profilId = Number((await request.json()).profil_id);
  if (!profilId) return NextResponse.json({ message: "Profil obligatoire." }, { status: 400 });
  if (!(await ownsProfile(access, profilId))) return NextResponse.json({ message: "Profil non autorisé." }, { status: 403 });
  let query = supabase.from("tickets").delete().eq("profil_id", profilId);
  query = access.role === "client" ? query.eq("owner_email", access.email) : query.is("owner_email", null);
  const { error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
