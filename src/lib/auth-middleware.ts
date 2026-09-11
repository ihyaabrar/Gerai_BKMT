import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession, type Role } from "@/lib/session";
import { isAdminRole } from "@/lib/permissions";

export interface SessionUser {
  id: string;
  nama: string;
  username: string;
  role: Role;
}

export type AuthResult =
  | { user: SessionUser; error?: never }
  | { user?: never; error: NextResponse };

const unauthorized = () =>
  NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

const forbidden = () =>
  NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

/**
 * Ambil user dari cookie session yang sudah diverifikasi tanda tangannya,
 * lalu cocokkan dengan keadaan akun di database.
 *
 * Tanda tangan cookie saja tidak cukup. Cookie berlaku 12 jam, jadi tanpa
 * pemeriksaan ini: menonaktifkan pengguna tidak melogout mereka, dan
 * menurunkan role admin menjadi kasir tidak mencabut apa pun — keduanya baru
 * berlaku setelah cookienya kedaluwarsa sendiri, mungkin keesokan harinya.
 *
 * Role diambil dari database, bukan dari cookie, supaya perubahan hak akses
 * langsung berlaku pada request berikutnya.
 *
 * Ini menambah satu pembacaan primary key per request. Middleware Edge tetap
 * memakai verifikasi tanda tangan saja, jadi biaya ini hanya pada route
 * handler yang memang akan menyentuh database.
 */
export async function getSessionUser(
  request: NextRequest | Request
): Promise<SessionUser | null> {
  const token =
    "cookies" in request && typeof (request as NextRequest).cookies?.get === "function"
      ? (request as NextRequest).cookies.get(SESSION_COOKIE)?.value
      : readCookieHeader(request.headers.get("cookie"), SESSION_COOKIE);

  const payload = await verifySession(token);
  if (!payload) return null;

  const akun = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, nama: true, username: true, role: true, aktif: true },
  });

  // Akun dihapus atau dinonaktifkan: cookienya masih sah secara kriptografis,
  // tetapi orangnya sudah tidak berhak masuk.
  if (!akun || !akun.aktif) return null;

  return {
    id: akun.id,
    nama: akun.nama,
    username: akun.username,
    role: akun.role as Role,
  };
}

function readCookieHeader(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/** Wajib login (role apa pun). Dipakai untuk endpoint operasional kasir. */
export async function requireAuth(
  request: NextRequest | Request
): Promise<AuthResult> {
  const user = await getSessionUser(request);
  if (!user) return { error: unauthorized() };
  return { user };
}

/** Wajib login dengan role master/admin. */
export async function requireAdminAuth(
  request: NextRequest | Request
): Promise<AuthResult> {
  const user = await getSessionUser(request);
  if (!user) return { error: unauthorized() };
  if (!isAdminRole(user.role)) return { error: forbidden() };
  return { user };
}

/** Wajib login dengan salah satu role tertentu. */
export async function requireRole(
  request: NextRequest | Request,
  roles: Role[]
): Promise<AuthResult> {
  const user = await getSessionUser(request);
  if (!user) return { error: unauthorized() };
  if (!roles.includes(user.role)) return { error: forbidden() };
  return { user };
}
