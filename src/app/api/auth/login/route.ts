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
 * Hash bcrypt sungguhan dari nilai yang tidak dipakai siapa pun, sebagai
 * pembanding tiruan agar waktu respons login seragam. Harus hash yang valid:
 * hash palsu ditolak bcrypt dalam nol milidetik dan justru tidak menyamakan
 * apa pun. Nilainya konstanta publik, bukan rahasia.
 */
const HASH_TIRUAN = "$2b$12$2m5k3Sdvv0KlB2gt.bUGWOLJiQJ30XZFyAvGNundcI.rLAXKc0ihC";

/**
 * Rate limit sederhana per-username di memori proses.
 *
 * Di serverless ini sebagian besar ilusi: setiap instance punya Map sendiri,
 * jadi batas efektifnya berlipat sebanyak instance yang aktif. Tetap
 * dipertahankan karena bcrypt cost 12 (~500 ms per percobaan) sudah menjadi
 * pengerem yang jauh lebih efektif, dan karena limiter yang TIDAK berbagi
 * state justru tidak bisa dipakai orang lain untuk mengunci akun kasir yang
 * sah selama 15 menit di tengah shift.
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
      // Perbandingan tiruan supaya waktu respons untuk username yang tidak ada
      // sama dengan yang ada. Tanpa ini, selisih ~250 ms dari bcrypt menjadi
      // cara mudah untuk menebak username mana yang terdaftar.
      await bcrypt.compare(password, HASH_TIRUAN);
      recordFailure(rateKey);
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Password yang tersimpan harus berupa hash bcrypt.
    //
    // Versi sebelumnya menyimpan jalur perbandingan plain-text untuk
    // mengupgrade akun lama. Jalur itu berarti siapa pun yang bisa menulis ke
    // tabel User — atau sebuah restore dari berkas lama — dapat memasang
    // password yang langsung bisa dipakai tanpa pernah melewati bcrypt.
    // Seluruh akun sudah bcrypt, jadi jalurnya dihapus.
    if (!user.password.startsWith("$2")) {
      console.error(
        JSON.stringify({
          pesan: "Password tersimpan bukan hash bcrypt",
          username: user.username,
          waktu: new Date().toISOString(),
        })
      );
      recordFailure(rateKey);
      return NextResponse.json(
        {
          error:
            "Akun ini perlu disetel ulang passwordnya oleh master sebelum bisa dipakai.",
        },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

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
      // Pesannya diteruskan apa adanya. Ini kesalahan konfigurasi server yang
      // hanya bisa diperbaiki oleh yang memasang aplikasi, dan menyamarkannya
      // jadi teks generik justru membuat orang mengulang langkah yang sudah
      // benar. Tidak ada rahasia di dalamnya — hanya nama variabel dan
      // panjangnya, bukan nilainya.
      return NextResponse.json(
        { error: `Server belum dikonfigurasi: ${error.message}` },
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
