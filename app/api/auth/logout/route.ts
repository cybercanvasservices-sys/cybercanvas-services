import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Deconnexion reussie",
  });

  response.cookies.delete("admin_session");
  response.cookies.delete("client_session");

  return response;
}
