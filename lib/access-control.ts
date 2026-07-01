import type { NextRequest } from "next/server";
import { getSessionPayload } from "@/lib/admin-session";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export type RequestAccess =
  | { role: "admin"; email: string }
  | { role: "client"; email: string; clientId: number; statut: string; emailVerified: boolean }
  | null;

export async function getRequestAccess(request: NextRequest): Promise<RequestAccess> {
  const adminSession = await getSessionPayload(
    request.cookies.get("admin_session")?.value
  );

  if (adminSession?.sub === "admin") {
    return { role: "admin", email: adminSession.email };
  }

  const clientSession = await getSessionPayload(
    request.cookies.get("client_session")?.value
  );

  if (clientSession?.sub !== "client" || !clientSession.email) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("clients")
    .select("id, statut, email_verified")
    .eq("email", clientSession.email)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    role: "client",
    email: clientSession.email,
    clientId: Number(data.id),
    statut: String(data.statut || "en_attente"),
    emailVerified: Boolean(data.email_verified),
  };
}

export async function isAdminOrActiveClient(request: NextRequest) {
  const access = await getRequestAccess(request);

  if (access?.role === "admin") {
    return true;
  }

  return Boolean(
    access?.role === "client" &&
      access.emailVerified &&
      access.statut === "actif"
  );
}

export function ownerFilter(access: RequestAccess) {
  return access?.role === "client" ? access.email : null;
}
