import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createAdminSession,
  getAdminSessionMaxAge,
} from "@/lib/admin-session";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@cybercanvas.local";
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "admin12345";
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

  if (
    email !== ADMIN_EMAIL.toLowerCase() ||
    password !== ADMIN_PASSWORD
  ) {
    registerFailedAttempt(clientKey);

    return NextResponse.json(
      { message: "Identifiants administrateur invalides" },
      { status: 401 }
    );
  }

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
