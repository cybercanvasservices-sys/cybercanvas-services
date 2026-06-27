import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSession, verifyClientSession } from "@/lib/admin-session";

const adminOnlyRoutes = ["/utilisateurs"];

export async function middleware(request: NextRequest) {
  const adminSession = request.cookies.get("admin_session")?.value;
  const clientSession = request.cookies.get("client_session")?.value;
  const isAdmin = await verifyAdminSession(adminSession);

  if (adminOnlyRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    if (isAdmin) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      request.nextUrl.pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  if (!(isAdmin || (await verifyClientSession(clientSession)))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/abonnements/:path*",
    "/clients/:path*",
    "/configuration/:path*",
    "/equipements/:path*",
    "/hotspots/:path*",
    "/liens/:path*",
    "/mikrotik/:path*",
    "/notifications/:path*",
    "/offres/:path*",
    "/paiements/:path*",
    "/parametres/:path*",
    "/profils/:path*",
    "/rapports/:path*",
    "/reclamations/:path*",
    "/retraits/:path*",
    "/revenus/:path*",
    "/routeurs/:path*",
    "/sms/:path*",
    "/statistiques/:path*",
    "/tickets/:path*",
    "/transactions/:path*",
    "/utilisateurs/:path*",
    "/ventes/:path*",
    "/wifi/:path*",
  ],
};

