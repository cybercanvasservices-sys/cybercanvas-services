import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

function clean(value: unknown) {
  return String(value || "").trim();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const nom = clean(body.nom).toLowerCase();
  const email = clean(body.email).toLowerCase();
  const telephone = normalizePhone(clean(body.telephone));

  if (!nom || !email || !telephone) {
    return NextResponse.json(
      { message: "Nom, telephone et email sont obligatoires." },
      { status: 400 }
    );
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, nom, email, telephone")
    .eq("email", email)
    .maybeSingle();

  const genericMessage =
    "Si les informations correspondent a un compte, un message de recuperation sera envoye.";

  if (!client) {
    return NextResponse.json({ message: genericMessage });
  }

  const clientPhone = normalizePhone(client.telephone || "");
  const nameMatches = String(client.nom || "").toLowerCase().includes(nom);
  const phoneMatches =
    clientPhone.endsWith(telephone.slice(-8)) ||
    telephone.endsWith(clientPhone.slice(-8));

  if (!nameMatches || !phoneMatches) {
    return NextResponse.json({ message: genericMessage });
  }

  const token =
    crypto.randomUUID().replaceAll("-", "") +
    crypto.randomUUID().replaceAll("-", "");
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("password_reset_requests").insert({
    client_id: client.id,
    email,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const resetUrl = new URL("/reset-password", request.url);
  resetUrl.searchParams.set("token", token);

  const emailResult = await sendEmail({
    to: email,
    subject: "Recuperation de votre compte CyberCanvas Services",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Recuperation de compte</h2>
        <p>Bonjour ${client.nom},</p>
        <p>Vous avez demande la recuperation de votre compte CyberCanvas Services.</p>
        <p><a href="${resetUrl.toString()}" style="display:inline-block;background:#06b6d4;color:#00111a;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Changer mon mot de passe</a></p>
        <p>Ce lien expire dans 1 heure. Si vous n'etes pas a l'origine de cette demande, ignorez ce message.</p>
      </div>
    `,
  });

  return NextResponse.json({
    message: emailResult.sent
      ? "Un message de recuperation a ete envoye dans votre boite email."
      : "Demande enregistree. L'envoi email sera actif apres configuration de RESEND_API_KEY.",
  });
}
