import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";
import { getTicketsDb } from "@/lib/cloudflare-d1";

type TicketStat = {
  profil_id: number;
  statut: string;
  total: number;
};

export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request.cookies.get("admin_session")?.value))) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const db = await getTicketsDb();

  if (!db) {
    return NextResponse.json(
      { message: "Base Cloudflare D1 non configuree." },
      { status: 500 }
    );
  }

  const { results } = await db
    .prepare(
      `select profil_id, statut, count(*) as total
       from tickets
       group by profil_id, statut`
    )
    .all<TicketStat>();

  return NextResponse.json({ stats: results || [] });
}
