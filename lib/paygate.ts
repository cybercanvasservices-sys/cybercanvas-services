import { createClient } from "@supabase/supabase-js";

type Ticket = { id: number; username: string; password: string; profil_id: number; owner_email: string | null };
type Profil = { prix: number; owner_email: string | null };
type PaygateStatus = { status?: number; phone_number?: string; error_code?: number; error_message?: string; amount?: number; amount_paid?: number; [key: string]: unknown };
type PaymentCheck = { ok: true; status: number; data: PaygateStatus } | { ok: false; status: number; message: string; data?: PaygateStatus };
export type TicketDeliveryResult = { success: true; status: number; message: string; ticket: Ticket; data?: PaygateStatus } | { success: false; status: number; message: string; data?: PaygateStatus };

function getSupabaseAdmin() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; return url && key ? createClient(url, key) : null; }
export function buildPaygateIdentifier(profilId: number) { return `TICKET-${profilId}-${crypto.randomUUID()}`; }
export function extractProfilIdFromIdentifier(identifier: string) { return identifier.match(/^TICKET-(\d+)-/)?.[1] || null; }

export async function checkPaygatePayment(identifier: string): Promise<PaymentCheck> {
  const token = process.env.PAYGATE_TOKEN;
  if (!token) return { ok: false, status: 500, message: "Configuration PayGate serveur manquante" };
  const response = await fetch("https://paygateglobal.com/api/v2/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auth_token: token, identifier }) });
  const data = (await response.json()) as PaygateStatus;
  if (!response.ok || data.error_code) return { ok: false, status: response.ok ? 400 : response.status, message: data.error_message || "PayGate a refusé la vérification du paiement", data };
  if (data.status !== 0) return { ok: false, status: 400, message: "Paiement non confirmé ou en attente", data };
  return { ok: true, status: 200, data };
}

export async function deliverTicketAfterPayment({ profilId, identifier }: { profilId: string | number; identifier: string }): Promise<TicketDeliveryResult> {
  if (!profilId || !identifier) return { success: false, status: 400, message: "Informations de paiement manquantes" };
  const payment = await checkPaygatePayment(identifier);
  if (!payment.ok) return { success: false, status: payment.status, message: payment.message, data: payment.data };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, status: 500, message: "Configuration Supabase serveur manquante", data: payment.data };
  const numericProfilId = Number(profilId);
  const { data: existing } = await supabase.from("tickets").select("id, username, password, profil_id, owner_email").eq("sale_identifier", identifier).eq("statut", "vendu").maybeSingle<Ticket>();
  if (existing) return { success: true, status: 200, message: "Paiement déjà confirmé", ticket: existing, data: payment.data };
  const { data: profil, error: profilError } = await supabase.from("profils").select("prix, owner_email").eq("id", numericProfilId).single<Profil>();
  if (profilError || !profil) return { success: false, status: 404, message: "Profil WiFi introuvable", data: payment.data };
  const paidAmount = Number(payment.data.amount ?? payment.data.amount_paid ?? 0);
  if (paidAmount > 0 && paidAmount !== Number(profil.prix)) return { success: false, status: 400, message: "Le montant du paiement ne correspond pas au profil WiFi", data: payment.data };
  const { data: available } = await supabase.from("tickets").select("id, username, password, profil_id, owner_email").eq("profil_id", numericProfilId).eq("statut", "disponible").order("id", { ascending: true }).limit(1).maybeSingle<Ticket>();
  if (!available) return { success: false, status: 404, message: "Aucun ticket disponible", data: payment.data };
  const { data: ticket, error: updateError } = await supabase.from("tickets").update({ statut: "vendu", sale_identifier: identifier, sold_at: new Date().toISOString() }).eq("id", available.id).eq("statut", "disponible").select("id, username, password, profil_id, owner_email").maybeSingle<Ticket>();
  if (updateError || !ticket) return { success: false, status: 409, message: "Le ticket vient d’être vendu, veuillez réessayer", data: payment.data };
  const { error: saleError } = await supabase.from("ventes").insert([{ profil_id: ticket.profil_id, ticket_id: ticket.id, montant: Math.max(Number(profil.prix) - Math.round(Number(profil.prix) * 0.1), 0), telephone: payment.data.phone_number || "", statut: "paye", owner_email: profil.owner_email || ticket.owner_email || null }]);
  if (saleError) { await supabase.from("tickets").update({ statut: "disponible", sale_identifier: null, sold_at: null }).eq("id", ticket.id); return { success: false, status: 500, message: "Le paiement est confirmé, mais l’enregistrement du crédit a échoué", data: payment.data }; }
  return { success: true, status: 200, message: "Paiement validé avec succès", ticket, data: payment.data };
}
