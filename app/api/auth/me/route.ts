import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionPayload } from "@/lib/admin-session";

export async function GET(request: NextRequest) {
  const adminSession = await getSessionPayload(
    request.cookies.get("admin_session")?.value
  );

  if (adminSession?.sub === "admin") {
    return NextResponse.json({
      authenticated: true,
      role: "admin",
      email: adminSession.email,
    });
  }

  const clientSession = await getSessionPayload(
    request.cookies.get("client_session")?.value
  );

  if (clientSession?.sub === "client") {
    return NextResponse.json({
      authenticated: true,
      role: "client",
      email: clientSession.email,
    });
  }

  return NextResponse.json({
    authenticated: false,
    role: null,
    email: null,
  });
}
