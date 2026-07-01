import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

function clean(value: unknown) {
  return String(value || "").trim();
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

function verificationEmailHtml(name: string, verificationUrl: string) {
  return `
    <div style="margin:0;padding:0;background:#f3f7fb;font-family:Arial,sans-serif;color:#0f172a">
      <div style="max-width:560px;margin:0 auto;padding:28px 16px">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
          <div style="background:#07111f;color:#ffffff;padding:22px 24px">
            <h1 style="margin:0;font-size:22px;line-height:1.3">CyberCanvas Services</h1>
            <p style="margin:6px 0 0;color:#99f6e4;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">Validation email</p>
          </div>
          <div style="padding:26px 24px;line-height:1.7">
            <h2 style="margin:0 0 12px;font-size:20px">Bonjour ${name},</h2>
            <p style="margin:0 0 14px">Voici un nouveau lien pour confirmer votre adresse e-mail.</p>
            <p style="margin:0 0 22px">
              <a href="${verificationUrl}" style="display:inline-block;background:#06b6d4;color:#00111a;padding:13px 20px;border-radius:10px;text-decoration:none;font-weight:800">Confirmer mon e-mail</a>
            </p>
            <p style="margin:0;color:#64748b;font-size:13px">Si vous n'avez pas demande ce lien, ignorez simplement ce message.</p>
          </div>
          <div style="border-top:1px solid #e2e8f0;padding:16px 24px;color:#64748b;font-size:12px">
            Le lien expire dans 24 heures.
          </div>
        </div>
      </div>
    </div>
  `;
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
  const email = clean(body.email).toLowerCase();

  if (!email) {
    return NextResponse.json(
      { message: "Adresse email obligatoire." },
      { status: 400 }
    );
  }

  const { data: client, error } = await supabase
    .from("clients")
    .select("id, nom, email_verified")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!client) {
    return NextResponse.json(
      { message: "Aucun compte ne correspond a cette adresse email." },
      { status: 404 }
    );
  }

  if (client.email_verified) {
    return NextResponse.json({
      message: "Cette adresse email est deja confirmee. Vous pouvez vous connecter.",
    });
  }

  const verificationToken =
    crypto.randomUUID().replaceAll("-", "") +
    crypto.randomUUID().replaceAll("-", "");
  const verificationUrl = new URL("/verification-email", request.url);
  verificationUrl.searchParams.set("token", verificationToken);

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      verification_token_hash: await hashToken(verificationToken),
      verification_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", client.id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  const result = await sendEmail({
    to: email,
    subject: "Nouveau lien de validation - CyberCanvas Services",
    html: verificationEmailHtml(client.nom || "Client", verificationUrl.toString()),
  });

  if (!result.sent) {
    return NextResponse.json(
      {
        message:
          "Le mail de validation n'a pas pu etre envoye. Verifiez l'adresse email ou contactez l'administrateur.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    message: "Un nouveau lien de validation a ete envoye a votre adresse email.",
  });
}
