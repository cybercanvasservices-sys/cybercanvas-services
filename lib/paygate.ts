import { createClient } from "@supabase/supabase-js";
import { ensureVentesSchema, getTicketsDb } from "@/lib/cloudflare-d1";

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
  amount?: number | string;
  amount_paid?: number | string;
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

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function constantTimeEqualHex(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

async function hmacSha256(secret: string, payload: Record<string, unknown>) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(JSON.stringify(payload))
  );

  return base64UrlEncode(new Uint8Array(signature));
}

export async function verifyPaygateWebhookSignature(
  payload: Record<string, unknown>,
  signature: string | null
) {
  const secret = process.env.PAYGATE_WEBHOOK_SECRET;

  if (!secret) {
    return { verified: false, configured: false };
  }

  if (!signature) {
    return { verified: false, configured: true };
  }

  const expected = await hmacSha256(secret, payload);

  return { verified: constantTimeEqualHex(signature, expected), configured: true };
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

  await ensureVentesSchema(db);

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
  const { data: profil, error: profilError } = await supabase
    .from("profils")
    .select("prix, owner_email")
    .eq("id", numericProfilId)
    .single<Profil>();

  if (profilError || !profil) {
    return {
      success: false,
      status: 404,
      message: "Profil WiFi introuvable",
      data: payment.data,
    };
  }

  const paidAmount = Number(payment.data?.amount ?? payment.data?.amount_paid);
  if (!paidAmount || paidAmount !== Number(profil.prix)) {
    return {
      success: false,
      status: 400,
      message: "Le montant du paiement ne correspond pas au profil WiFi",
      data: payment.data,
    };
  }

  const telephone = payment.data?.phone_number || "";
  const montantNet = Math.max(
    Number(profil.prix) - Math.round(Number(profil.prix) * 0.1),
    0
  );

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
    const ownerEmail = profil.owner_email || existingTicket.owner_email || null;

    await db
      .prepare(
        `insert or ignore into ventes
         (profil_id, ticket_id, montant, telephone, statut, owner_email, sale_identifier)
         values (?, ?, ?, ?, 'paye', ?, ?)`
      )
      .bind(
        existingTicket.profil_id,
        existingTicket.id,
        montantNet,
        telephone,
        ownerEmail,
        identifier
      )
      .run();

    const saved = await db
      .prepare("select id from ventes where sale_identifier = ?")
      .bind(identifier)
      .first<{ id: number }>();

    if (!saved) {
      return {
        success: false,
        status: 500,
        message:
          "Le paiement est confirme, mais l enregistrement du credit a echoue",
        data: payment.data,
      };
    }

    return {
      success: true,
      status: 200,
      message: "Paiement deja confirme",
      ticket: existingTicket,
      data: payment.data,
    };
  }

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

  const ownerEmail = profil.owner_email || ticketDispo.owner_email || null;

  await db
    .prepare(
      `insert into ventes
       (profil_id, ticket_id, montant, telephone, statut, owner_email, sale_identifier)
       values (?, ?, ?, ?, 'paye', ?, ?)`
    )
    .bind(
      ticketDispo.profil_id,
      ticketDispo.id,
      montantNet,
      telephone,
      ownerEmail,
      identifier
    )
    .run();

  const saved = await db
    .prepare("select id from ventes where sale_identifier = ?")
    .bind(identifier)
    .first<{ id: number }>();

  if (!saved) {
    await db
      .prepare(
        "update tickets set statut = 'disponible', sale_identifier = null, sold_at = null where id = ?"
      )
      .bind(ticketDispo.id)
      .run();

    return {
      success: false,
      status: 500,
      message:
        "Le paiement est confirme, mais l enregistrement du credit a echoue",
      data: payment.data,
    };
  }

  return {
    success: true,
    status: 200,
    message: "Paiement valide avec succes",
    ticket: ticketDispo,
    data: payment.data,
  };
}