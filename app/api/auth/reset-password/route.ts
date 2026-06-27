import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/passwords";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

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
  const token = String(body.token || "").trim();
  const password = String(body.password || "");

  if (!token || password.length < 8) {
    return NextResponse.json(
      { message: "Lien invalide ou mot de passe trop court." },
      { status: 400 }
    );
  }

  const tokenHash = await hashToken(token);
  const { data: resetRequest, error } = await supabase
    .from("password_reset_requests")
    .select("id, client_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !resetRequest || resetRequest.used_at) {
    return NextResponse.json(
      { message: "Lien de recuperation invalide." },
      { status: 400 }
    );
  }

  if (new Date(resetRequest.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { message: "Lien de recuperation expire." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("clients")
    .update({ password_hash: await hashPassword(password) })
    .eq("id", resetRequest.client_id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  await supabase
    .from("password_reset_requests")
    .update({ used_at: new Date().toISOString() })
    .eq("id", resetRequest.id);

  return NextResponse.json({
    message: "Mot de passe modifie. Vous pouvez vous connecter.",
  });
}
