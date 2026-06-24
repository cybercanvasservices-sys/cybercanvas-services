import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Ticket = {
  id: number;
  username: string;
  password: string;
  profil_id: number;
};

type Profil = {
  prix: number;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

async function checkPaygatePayment(identifier: string) {
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

  const data = await response.json();

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

export async function POST(req: Request) {
  try {
    const { profilId, identifier } = await req.json();

    if (!profilId || !identifier) {
      return NextResponse.json(
        {
          success: false,
          message: "Informations de paiement manquantes",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          message: "Configuration Supabase serveur manquante",
        },
        { status: 500 }
      );
    }

    const payment = await checkPaygatePayment(identifier);

    if (!payment.ok) {
      return NextResponse.json(
        {
          success: false,
          message: payment.message,
          data: payment.data,
        },
        { status: payment.status }
      );
    }

    const { data: ticketDispo, error: ticketError } = await supabase
      .from("tickets")
      .select("id, username, password, profil_id")
      .eq("profil_id", Number(profilId))
      .eq("statut", "disponible")
      .order("id", { ascending: true })
      .limit(1)
      .single<Ticket>();

    if (ticketError || !ticketDispo) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucun ticket disponible",
        },
        { status: 404 }
      );
    }

    const { data: profil } = await supabase
      .from("profils")
      .select("prix")
      .eq("id", ticketDispo.profil_id)
      .single<Profil>();

    await supabase
      .from("tickets")
      .update({
        statut: "vendu",
      })
      .eq("id", ticketDispo.id);

    await supabase.from("ventes").insert([
      {
        profil_id: ticketDispo.profil_id,
        ticket_id: ticketDispo.id,
        montant: profil?.prix || 0,
        telephone: payment.data?.phone_number || "",
        statut: "paye",
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Paiement valide avec succes",
      ticket: ticketDispo,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la verification du paiement",
      },
      { status: 500 }
    );
  }
}
