import type { NextRequest } from "next/server";
import { verifyAdminSession, getSessionPayload } from "@/lib/admin-session";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function isAdminOrActiveClient(request: NextRequest) {
  const adminSession = request.cookies.get("admin_session")?.value;

  if (await verifyAdminSession(adminSession)) {
    return true;
  }

  const clientSession = await getSessionPayload(
    request.cookies.get("client_session")?.value
  );

  if (clientSession?.sub !== "client" || !clientSession.email) {
    return false;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { data } = await supabase
    .from("clients")
    .select("statut, email_verified")
    .eq("email", clientSession.email)
    .maybeSingle();

  return Boolean(data?.email_verified && data?.statut === "actif");
}
