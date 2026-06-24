import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdminSession(req.cookies.get("admin_session")?.value))) {
      return NextResponse.json({ message: "Non autorise." }, { status: 401 });
    }

    const { identifier } = await req.json();
    const paygateToken = process.env.PAYGATE_TOKEN;

    if (!identifier) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant manquant",
        },
        { status: 400 }
      );
    }

    if (!paygateToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Configuration PayGate serveur manquante",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://paygateglobal.com/api/v2/status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_token: paygateToken,
          identifier,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data?.error_code) {
      return NextResponse.json(
        {
          success: false,
          message:
            data?.error_message ||
            "PayGate a refuse la verification du paiement",
          data,
        },
        { status: response.ok ? 400 : response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
      },
      { status: 500 }
    );
  }
}
