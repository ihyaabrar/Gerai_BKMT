import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  MissingAuthSecretError,
  SESSION_COOKIE,
  signSession,
  sessionCookieOptions,
  type Role,
} from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Rate limit sederhana per-username di memori proses.
 * Bukan pengganti rate limit di edge/proxy, tapi cukup untuk
 * memperlambat brute force pada deployment satu instance.
 */
const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function tooManyAttempts(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: Date.now() });
    return;
  }
  entry.count += 1;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const rateKey = username.toLowerCase();
    if (tooManyAttempts(rateKey)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.aktif) {
      recordFailure(rateKey);
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Password lama yang masih plain text di-upgrade ke bcrypt saat login berhasil.
    let isValid: boolean;
    if (user.password.startsWith("$2")) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      isValid = user.password === password;
      if (isValid) {
        const hashed = await bcrypt.hash(password, 12);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashed },
        });
      }
    }

    if (!isValid) {
      recordFailure(rateKey);
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    attempts.delete(rateKey);

    const sessionUser = {
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role as Role,
    };

    const response = NextResponse.json({ success: true, user: sessionUser });
    response.cookies.set(
      SESSION_COOKIE,
      await signSession(sessionUser),
      sessionCookieOptions
    );

    return response;
  } catch (error) {
    if (error instanceof MissingAuthSecretError) {
      console.error("Konfigurasi salah:", error.message);
      return NextResponse.json(
        { error: "Server belum dikonfigurasi: AUTH_SECRET belum diatur." },
        { status: 500 }
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}
