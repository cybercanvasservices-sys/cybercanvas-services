import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionPayload } from "@/lib/admin-session";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

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
    const supabase = getSupabaseAdminClient();
    let client = null;

    if (supabase) {
      const { data } = await supabase
        .from("clients")
        .select("id, nom, entreprise, email, telephone, ville, statut, discussion, photo, email_verified, created_at")
        .eq("email", clientSession.email)
        .maybeSingle();

      client = data || null;
    }

    return NextResponse.json({
      authenticated: true,
      role: "client",
      email: clientSession.email,
      client,
    });
  }

  return NextResponse.json({
    authenticated: false,
    role: null,
    email: null,
  });
}
