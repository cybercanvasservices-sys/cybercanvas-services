import { NextResponse } from "next/server";
import {
  deliverTicketAfterPayment,
  extractProfilIdFromIdentifier,
} from "@/lib/paygate";

type CallbackPayload = Record<string, string>;

const identifierKeys = [
  "identifier",
  "tx_reference",
  "transaction_id",
  "reference",
  "ref",
  "payment_reference",
];

const profilKeys = ["profilId", "profil_id", "profil"];

async function readCallbackPayload(req: Request): Promise<CallbackPayload> {
  const payload: CallbackPayload = {};
  const url = new URL(req.url);

  url.searchParams.forEach((value, key) => {
    payload[key] = value;
  });

  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as Record<string, unknown>;
      Object.entries(body).forEach(([key, value]) => {
        if (value !== undefined && value !== null) payload[key] = String(value);
      });
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = String(value);
      });
    } else {
      const text = await req.text();

      if (text) {
        const params = new URLSearchParams(text);
        params.forEach((value, key) => {
          payload[key] = value;
        });
      }
    }
  } catch {
    // PayGate peut appeler avec plusieurs formats. Les query params restent utilisables.
  }

  return payload;
}

function pickValue(payload: CallbackPayload, keys: string[]) {
  return keys.map((key) => payload[key]).find(Boolean) || "";
}

async function handleCallback(req: Request) {
  try {
    const payload = await readCallbackPayload(req);
    const identifier = pickValue(payload, identifierKeys);
    const profilId =
      pickValue(payload, profilKeys) ||
      extractProfilIdFromIdentifier(identifier || "");

    if (!identifier || !profilId) {
      return NextResponse.json(
        {
          success: false,
          message: "Callback PayGate incomplet",
          payload,
        },
        { status: 400 }
      );
    }

    const result = await deliverTicketAfterPayment({ profilId, identifier });

    return NextResponse.json(result, { status: result.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du traitement du callback PayGate",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handleCallback(req);
}

export async function POST(req: Request) {
  return handleCallback(req);
}
