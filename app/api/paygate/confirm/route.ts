import { NextResponse } from "next/server";
import { deliverTicketAfterPayment } from "@/lib/paygate";

export async function POST(req: Request) {
  try {
    const { profilId, identifier } = await req.json();
    const result = await deliverTicketAfterPayment({ profilId, identifier });

    return NextResponse.json(result, { status: result.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la verification du paiement",
      },
      { status: 500 }
    );
  }
}
