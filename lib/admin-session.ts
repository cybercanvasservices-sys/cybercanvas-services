const SESSION_TTL_SECONDS = 60 * 60 * 8;

type SessionRole = "admin" | "client";

type SessionPayload = {
  sub: SessionRole;
  email: string;
  exp: number;
  nonce: string;
};

function base64UrlEncode(input: Uint8Array | string) {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

async function sign(value: string) {
  const secret = getSessionSecret();

  if (!secret) {
    return "";
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return base64UrlEncode(new Uint8Array(signature));
}

async function createSession(email: string, role: SessionRole) {
  const payload: SessionPayload = {
    sub: role,
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: crypto.randomUUID(),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encodedPayload);

  if (!signature) {
    return "";
  }

  return `${encodedPayload}.${signature}`;
}

async function verifySession(session: string | undefined, role: SessionRole) {
  const payload = await getSessionPayload(session);

  return Boolean(payload && payload.sub === role);
}

export async function getSessionPayload(session: string | undefined) {
  if (!session) {
    return null;
  }

  const [encodedPayload, signature] = session.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await sign(encodedPayload);

  if (!expectedSignature || signature !== expectedSignature) {
    return null;
  }

  try {
    const decoded = new TextDecoder().decode(base64UrlDecode(encodedPayload));
    const payload = JSON.parse(decoded) as SessionPayload;

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createAdminSession(email: string) {
  return createSession(email, "admin");
}

export function createClientSession(email: string) {
  return createSession(email, "client");
}

export function verifyAdminSession(session?: string) {
  return verifySession(session, "admin");
}

export function verifyClientSession(session?: string) {
  return verifySession(session, "client");
}

export function getAdminSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}
