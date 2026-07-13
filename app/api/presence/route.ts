import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionPayload } from "@/lib/admin-session";

type PresenceEntry = {
  email: string;
  role: "admin" | "client";
  lastSeen: number;
};

const PRESENCE_TTL_MS = 90 * 1000;

const globalPresence = globalThis as typeof globalThis & {
  cybercanvasPresence?: Map<string, PresenceEntry>;
};

function getPresenceStore() {
  if (!globalPresence.cybercanvasPresence) {
    globalPresence.cybercanvasPresence = new Map<string, PresenceEntry>();
  }

  return globalPresence.cybercanvasPresence;
}

function removeExpiredEntries(store: Map<string, PresenceEntry>) {
  const now = Date.now();

  for (const [key, entry] of store.entries()) {
    if (now - entry.lastSeen > PRESENCE_TTL_MS) {
      store.delete(key);
    }
  }
}

async function getSession(request: NextRequest) {
  const admin = await getSessionPayload(request.cookies.get("admin_session")?.value);

  if (admin?.sub === "admin") {
    return admin;
  }

  const client = await getSessionPayload(request.cookies.get("client_session")?.value);

  if (client?.sub === "client") {
    return client;
  }

  return null;
}

function presenceResponse(store: Map<string, PresenceEntry>) {
  removeExpiredEntries(store);

  const entries = Array.from(store.values());
  const adminCount = entries.filter((entry) => entry.role === "admin").length;
  const clientCount = entries.filter((entry) => entry.role === "client").length;
  const updatedAt = new Date().toISOString();

  return NextResponse.json({
    online: entries.length,
    admins: adminCount,
    clients: clientCount,
    updatedAt,
    updatedAtGmt: new Date(updatedAt).toUTCString(),
  });
}

export async function GET() {
  return presenceResponse(getPresenceStore());
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json(
      { message: "Session non active." },
      { status: 401 }
    );
  }

  const store = getPresenceStore();
  store.set(`${session.sub}:${session.email}`, {
    email: session.email,
    role: session.sub,
    lastSeen: Date.now(),
  });

  return presenceResponse(store);
}