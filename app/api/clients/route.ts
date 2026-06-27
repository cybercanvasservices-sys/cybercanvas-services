import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";
import { sendEmail } from "@/lib/email";
import { hashPassword } from "@/lib/passwords";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

async function isAdmin(request: NextRequest) {
  return verifyAdminSession(request.cookies.get("admin_session")?.value);
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function getAdminAlertEmail() {
  return process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || "";
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

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, nom, entreprise, email, telephone, ville, statut, discussion, photo, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: data || [] });
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
  const nom = clean(body.nom);
  const email = clean(body.email).toLowerCase();
  const telephone = clean(body.telephone);
  const password = String(body.password || "");

  if (!nom || !email || !telephone || !password) {
    return NextResponse.json(
      { message: "Nom, telephone, email et mot de passe sont obligatoires." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { message: "Le mot de passe doit contenir au moins 8 caracteres." },
      { status: 400 }
    );
  }

  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingClient) {
    return NextResponse.json(
      { message: "Une demande existe deja avec cette adresse email." },
      { status: 409 }
    );
  }

  const verificationToken =
    crypto.randomUUID().replaceAll("-", "") +
    crypto.randomUUID().replaceAll("-", "");
  const verificationUrl = new URL("/verification-email", request.url);
  verificationUrl.searchParams.set("token", verificationToken);

  const { error } = await supabase.from("clients").insert({
    nom,
    email,
    telephone,
    entreprise: clean(body.entreprise) || "Non renseignee",
    ville: clean(body.ville) || "Non renseignee",
    statut: "en_attente",
    discussion: false,
    email_verified: false,
    verification_token_hash: await hashToken(verificationToken),
    verification_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    password_hash: await hashPassword(password),
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  await sendEmail({
    to: email,
    subject: "Validation de votre adresse email - CyberCanvas Services",
    html: `
      <div style="margin:0;padding:0;background:#f3f7fb;font-family:Arial,sans-serif;color:#0f172a">
        <div style="max-width:560px;margin:0 auto;padding:28px 16px">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
            <div style="background:#07111f;color:#ffffff;padding:22px 24px">
              <h1 style="margin:0;font-size:22px;line-height:1.3">CyberCanvas Services</h1>
              <p style="margin:6px 0 0;color:#99f6e4;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">Validation email</p>
            </div>
            <div style="padding:26px 24px;line-height:1.7">
              <h2 style="margin:0 0 12px;font-size:20px">Bonjour ${nom},</h2>
              <p style="margin:0 0 14px">Merci pour votre inscription sur CyberCanvas Services.</p>
              <p style="margin:0 0 22px">Veuillez cliquer sur le bouton ci-dessous pour confirmer que cette adresse e-mail vous appartient.</p>
              <p style="margin:0 0 22px">
                <a href="${verificationUrl.toString()}" style="display:inline-block;background:#06b6d4;color:#00111a;padding:13px 20px;border-radius:10px;text-decoration:none;font-weight:800">Confirmer mon e-mail</a>
              </p>
              <p style="margin:0 0 14px">Vous devez valider votre e-mail avant de pouvoir utiliser vos identifiants de connexion.</p>
              <p style="margin:0;color:#64748b;font-size:13px">Si vous n'avez pas cree de compte sur CyberCanvas Services, ignorez simplement ce message.</p>
            </div>
            <div style="border-top:1px solid #e2e8f0;padding:16px 24px;color:#64748b;font-size:12px">
              Ce message vous est envoye parce qu'une inscription a ete faite sur CyberCanvas Services. Le lien expire dans 24 heures.
            </div>
          </div>
        </div>
      </div>
    `,
  });

  const adminAlertEmail = getAdminAlertEmail();

  if (adminAlertEmail) {
    const utilisateursUrl = new URL("/utilisateurs", request.url);

    await sendEmail({
      to: adminAlertEmail,
      subject: "Nouvelle inscription a valider - CyberCanvas Services",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>Nouvelle inscription client</h2>
          <p>Une nouvelle demande de compte vient d'etre envoyee sur CyberCanvas Services.</p>
          <table style="border-collapse:collapse;margin:16px 0;width:100%;max-width:520px">
            <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">Nom</td><td style="padding:8px;border:1px solid #e2e8f0">${nom}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">Email</td><td style="padding:8px;border:1px solid #e2e8f0">${email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">Telephone</td><td style="padding:8px;border:1px solid #e2e8f0">${telephone}</td></tr>
          </table>
          <p>Connectez-vous a l'espace administrateur pour valider ou refuser cette inscription.</p>
          <p><a href="${utilisateursUrl.toString()}" style="display:inline-block;background:#06b6d4;color:#00111a;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Ouvrir les validations</a></p>
        </div>
      `,
    });
  }

  return NextResponse.json({
    message:
      "Votre compte a ete cree. Consultez votre boite email pour confirmer votre inscription.",
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const id = Number(body.id);

  if (!id) {
    return NextResponse.json(
      { message: "Identifiant client manquant." },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {};

  for (const field of ["nom", "entreprise", "email", "telephone", "ville", "photo"]) {
    if (field in body) payload[field] = clean(body[field]);
  }

  if ("statut" in body) {
    payload.statut = clean(body.statut);
    if (payload.statut !== "actif") {
      payload.discussion = false;
    }
  }

  if ("discussion" in body) {
    payload.discussion = Boolean(body.discussion);
  }

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select("id, nom, entreprise, email, telephone, ville, statut, discussion, photo, created_at")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (payload.statut === "actif" && data.email) {
    await sendEmail({
      to: data.email,
      subject: "Compte valide - CyberCanvas Services",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>Votre compte est valide</h2>
          <p>Bonjour ${data.nom},</p>
          <p>Votre compte CyberCanvas Services a ete valide par l'administrateur.</p>
          <p>Vous pouvez maintenant vous connecter.</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ client: data });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Configuration Supabase serveur manquante." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const id = Number(body.id);

  if (!id) {
    return NextResponse.json(
      { message: "Identifiant client manquant." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
