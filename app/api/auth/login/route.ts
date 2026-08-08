import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createClientSession,
  createAdminSession,
  getAdminSessionMaxAge,
} from "@/lib/admin-session";
import { verifyPassword } from "@/lib/passwords";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const attempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function isBlocked(key: string) {
  const current = attempts.get(key);

  return Boolean(current && current.blockedUntil > Date.now());
}

function registerFailedAttempt(key: string) {
  const current = attempts.get(key);
  const nextCount = (current?.count || 0) + 1;

  attempts.set(key, {
    count: nextCount,
    blockedUntil:
      nextCount >= MAX_ATTEMPTS ? Date.now() + WINDOW_SECONDS * 1000 : 0,
  });
}

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);

  if (isBlocked(clientKey)) {
    return NextResponse.json(
      { message: "Trop de tentatives. Reessayez plus tard." },
      { status: 429 }
    );
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email et mot de passe obligatoires." },
      { status: 400 }
    );
  }

  if (
    ADMIN_EMAIL &&
    ADMIN_PASSWORD &&
    email === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD
  ) {
    attempts.delete(clientKey);

    const session = await createAdminSession(email);

    if (!session) {
      return NextResponse.json(
        { message: "Configuration session administrateur manquante" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      message: "Connexion administrateur reussie",
      role: "admin",
    });

    response.cookies.set("admin_session", session, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getAdminSessionMaxAge(),
    });

    return response;
  }

  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { data: client, error } = await supabase
      .from("clients")
      .select("email, statut, password_hash, email_verified")
      .eq("email", email)
      .maybeSingle();

    if (!error && client && (await verifyPassword(password, client.password_hash))) {
      if (!client.email_verified) {
        return NextResponse.json(
          { message: "Votre compte a bien été créé, mais votre adresse e-mail n’est pas encore confirmée." },
          { status: 403 }
        );
      }

      if (client.statut === "refuse") {
        return NextResponse.json(
          { message: "Votre demande de compte a ete refusee." },
          { status: 403 }
        );
      }

      if (client.statut === "suspendu") {
        return NextResponse.json(
          { message: "Votre compte est suspendu. Contactez CyberCanvas Services." },
          { status: 403 }
        );
      }

      attempts.delete(clientKey);

      const session = await createClientSession(email);

      if (!session) {
        return NextResponse.json(
          { message: "Configuration session client manquante." },
          { status: 500 }
        );
      }

      const response = NextResponse.json({
        message: "Connexion client reussie",
        role: "client",
      });

      response.cookies.set("client_session", session, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: getAdminSessionMaxAge(),
      });

      return response;
    }
  }

  registerFailedAttempt(clientKey);

  return NextResponse.json(
    {
      message:
        "Identifiants invalides. Verifiez votre email et votre mot de passe.",
    },
    { status: 401 }
  );
}
