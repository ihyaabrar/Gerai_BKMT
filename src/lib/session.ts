/**
 * Session tertanda tangan (HMAC-SHA256).
 *
 * Sebelumnya cookie `session` berisi JSON polos sehingga siapa pun bisa
 * memalsukannya menjadi `{"role":"master"}` dan mendapat akses penuh.
 * Sekarang payload ditandatangani dengan AUTH_SECRET dan diverifikasi
 * di server pada setiap request.
 *
 * Memakai Web Crypto (bukan node:crypto) agar bisa dipakai baik di
 * Route Handler (Node runtime) maupun di middleware (Edge runtime).
 */

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 jam

export type Role = "master" | "admin" | "kasir";

export interface SessionPayload {
  id: string;
  nama: string;
  username: string;
  role: Role;
  /** epoch detik — kapan sesi kedaluwarsa */
  exp: number;
}

const DEV_FALLBACK_SECRET = "gerai-bkmt-dev-secret-jangan-dipakai-di-produksi";

export const MISSING_SECRET_MESSAGE =
  "AUTH_SECRET belum diatur di environment (minimal 32 karakter). " +
  "Generate dengan: openssl rand -base64 32";

export class MissingAuthSecretError extends Error {
  constructor() {
    super(MISSING_SECRET_MESSAGE);
    this.name = "MissingAuthSecretError";
  }
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      // Sengaja gagal keras: tanpa rahasia yang benar, cookie sesi
      // tidak bisa dipercaya sama sekali.
      throw new MissingAuthSecretError();
    }
    return DEV_FALLBACK_SECRET;
  }

  return secret;
}

const encoder = new TextEncoder();

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Buat token `<payload>.<signature>` untuk disimpan di cookie. */
export async function signSession(
  payload: Omit<SessionPayload, "exp">
): Promise<string> {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const body = toBase64Url(encoder.encode(JSON.stringify(full)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    encoder.encode(body)
  );

  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Verifikasi token cookie. Mengembalikan null bila palsu / kedaluwarsa. */
export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromBase64Url(signature),
      encoder.encode(body)
    );
  } catch {
    return null;
  }

  if (!valid) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
  } catch {
    return null;
  }

  if (!payload?.id || !payload?.role) return null;
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
    return null;
  }

  return payload;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE,
  path: "/",
};
