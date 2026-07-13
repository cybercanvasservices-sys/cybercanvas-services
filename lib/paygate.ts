import { createClient } from "@supabase/supabase-js";
import { getTicketsDb } from "@/lib/cloudflare-d1";

type Ticket = {
  id: number;
  username: string;
  password: string;
  profil_id: number;
  owner_email: string | null;
};

type Profil = {
  prix: number;
  owner_email: string | null;
};

type PaygateStatus = {
  status?: number;
  phone_number?: string;
  error_code?: number;
  error_message?: string;
  [key: string]: unknown;
};

type PaymentCheck =
  | {
      ok: true;
      status: number;
      data: PaygateStatus;
    }
  | {
      ok: false;
      status: number;
      message: string;
      data?: PaygateStatus;
    };

export type TicketDeliveryResult =
  | {
      success: true;
      status: number;
      message: string;
      ticket: Ticket;
      data?: PaygateStatus;
    }
  | {
      success: false;
      status: number;
      message: string;
      data?: PaygateStatus;
    };

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export function buildPaygateIdentifier(profilId: number) {
  return `TICKET-${profilId}-${crypto.randomUUID()}`;
}

export function extractProfilIdFromIdentifier(identifier: string) {
  const match = identifier.match(/^TICKET-(\d+)-/);
  return match?.[1] || null;
}

export async function checkPaygatePayment(identifier: string): Promise<PaymentCheck> {
  const paygateToken = process.env.PAYGATE_TOKEN;

  if (!paygateToken) {
    return {
      ok: false,
      status: 500,
      message: "Configuration PayGate serveur manquante",
    };
  }

  const response = await fetch("https://paygateglobal.com/api/v2/status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_token: paygateToken,
      identifier,
    }),
  });

  const data = (await response.json()) as PaygateStatus;

  if (!response.ok || data?.error_code) {
    return {
      ok: false,
      status: response.ok ? 400 : response.status,
      message:
        data?.error_message || "PayGate a refuse la verification du paiement",
      data,
    };
  }

  if (data?.status !== 0) {
    return {
      ok: false,
      status: 400,
      message: "Paiement non confirme ou en attente",
      data,
    };
  }

  return {
    ok: true,
    status: 200,
    data,
  };
}

export async function deliverTicketAfterPayment({
  profilId,
  identifier,
}: {
  profilId: string | number;
  identifier: string;
}): Promise<TicketDeliveryResult> {
  if (!profilId || !identifier) {
    return {
      success: false,
      status: 400,
      message: "Informations de paiement manquantes",
    };
  }

  const payment = await checkPaygatePayment(identifier);

  if (!payment.ok) {
    return {
      success: false,
      status: payment.status,
      message: payment.message,
      data: payment.data,
    };
  }

  const db = await getTicketsDb();

  if (!db) {
    return {
      success: false,
      status: 500,
      message: "Base tickets Cloudflare D1 non configuree",
      data: payment.data,
    };
  }

  const existingTicket = await db
    .prepare(
      `select id, username, password, profil_id, owner_email
       from tickets
       where sale_identifier = ? and statut = 'vendu'
       limit 1`
    )
    .bind(identifier)
    .first<Ticket>();

  if (existingTicket) {
    return {
      success: true,
      status: 200,
      message: "Paiement deja confirme",
      ticket: existingTicket,
      data: payment.data,
    };
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      success: false,
      status: 500,
      message: "Configuration Supabase serveur manquante",
      data: payment.data,
    };
  }

  const numericProfilId = Number(profilId);
  const { data: profil } = await supabase
    .from("profils")
    .select("prix, owner_email")
    .eq("id", numericProfilId)
    .single<Profil>();

  const ticketDispo = await db
    .prepare(
      `update tickets
       set statut = 'vendu', sale_identifier = ?, sold_at = current_timestamp
       where id = (
         select id from tickets
         where profil_id = ? and statut = 'disponible'
         order by id asc
         limit 1
       )
       returning id, username, password, profil_id, owner_email`
    )
    .bind(identifier, numericProfilId)
    .first<Ticket>();

  if (!ticketDispo) {
    return {
      success: false,
      status: 404,
      message: "Aucun ticket disponible",
      data: payment.data,
    };
  }

  await supabase.from("ventes").insert([
    {
      profil_id: ticketDispo.profil_id,
      ticket_id: ticketDispo.id,
      montant: profil?.prix || 0,
      telephone: payment.data?.phone_number || "",
      statut: "paye",
      owner_email: profil?.owner_email || ticketDispo.owner_email || null,
    },
  ]);

  return {
    success: true,
    status: 200,
    message: "Paiement valide avec succes",
    ticket: ticketDispo,
    data: payment.data,
  };
}
