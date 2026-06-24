const SESSION_TTL_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  sub: "admin";
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

export async function createAdminSession(email: string) {
  const payload: AdminSessionPayload = {
    sub: "admin",
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

export async function verifyAdminSession(session?: string) {
  if (!session) {
    return false;
  }

  const [encodedPayload, signature] = session.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await sign(encodedPayload);

  if (!expectedSignature || signature !== expectedSignature) {
    return false;
  }

  try {
    const decoded = new TextDecoder().decode(base64UrlDecode(encodedPayload));
    const payload = JSON.parse(decoded) as AdminSessionPayload;

    return payload.sub === "admin" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function getAdminSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}
