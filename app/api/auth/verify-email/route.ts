import { NextRequest, NextResponse } from "next/server";
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

  if (!token) {
    return NextResponse.json(
      { message: "Lien de verification invalide." },
      { status: 400 }
    );
  }

  const tokenHash = await hashToken(token);
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, verification_expires_at, email_verified")
    .eq("verification_token_hash", tokenHash)
    .maybeSingle();

  if (error || !client) {
    return NextResponse.json(
      { message: "Lien de verification invalide." },
      { status: 400 }
    );
  }

  if (client.email_verified) {
    return NextResponse.json({
      message: "Votre compte est deja confirme. Vous pouvez vous connecter.",
    });
  }

  if (
    client.verification_expires_at &&
    new Date(client.verification_expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { message: "Lien de verification expire. Refaites une inscription ou contactez le support." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      email_verified: true,
      verification_token_hash: null,
      verification_expires_at: null,
    })
    .eq("id", client.id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Votre adresse email est confirmee. Vous pouvez vous connecter.",
  });
}
