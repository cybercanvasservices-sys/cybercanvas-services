import { NextRequest, NextResponse } from "next/server";
import { getRequestAccess } from "@/lib/access-control";
import { getTicketsDb } from "@/lib/cloudflare-d1";

type TicketStat = {
  profil_id: number;
  statut: string;
  total: number;
};

export async function GET(request: NextRequest) {
  const access = await getRequestAccess(request);

  if (
    !(
      access?.role === "admin" ||
      (access?.role === "client" &&
        access.emailVerified &&
        access.statut === "actif")
    )
  ) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const db = await getTicketsDb();

  if (!db) {
    return NextResponse.json(
      { message: "Base Cloudflare D1 non configuree." },
      { status: 500 }
    );
  }

  const query =
    access.role === "client"
      ? db
          .prepare(
            `select profil_id, statut, count(*) as total
             from tickets
             where owner_email = ?
             group by profil_id, statut`
          )
          .bind(access.email)
      : db.prepare(
          `select profil_id, statut, count(*) as total
           from tickets
           group by profil_id, statut`
        );

  const { results } = await query.all<TicketStat>();

  return NextResponse.json({ stats: results || [] });
}
