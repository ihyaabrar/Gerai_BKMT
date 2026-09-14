import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import bcrypt from "bcryptjs";
import { ValidationError, requireString, toErrorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * Ganti password milik sendiri.
 *
 * Berlaku untuk semua role — termasuk kasir, yang tidak punya akses ke
 * halaman pengelolaan pengguna. Password lama tetap diminta supaya sesi
 * yang tertinggal terbuka di perangkat lain tidak bisa mengambil alih akun.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const passwordLama = requireString(body?.passwordLama, "Password saat ini", {
      max: 100,
    });
    const passwordBaru = requireString(body?.passwordBaru, "Password baru", {
      min: 8,
      max: 100,
    });

    if (passwordLama === passwordBaru) {
      throw new ValidationError("Password baru harus berbeda dari password saat ini");
    }

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Sama seperti login: password tersimpan yang bukan hash bcrypt tidak
    // pernah dibandingkan apa adanya. Jalur plain-text di sini dulu berarti
    // siapa pun yang bisa menulis ke tabel User dapat memasang password yang
    // langsung diterima — dan sekaligus dicuci menjadi hash bcrypt yang sah.
    if (!user.password.startsWith("$2")) {
      return NextResponse.json(
        {
          error:
            "Akun ini perlu disetel ulang passwordnya oleh master sebelum bisa dipakai.",
        },
        { status: 400 }
      );
    }

    const cocok = await bcrypt.compare(passwordLama, user.password);

    if (!cocok) {
      return NextResponse.json(
        { error: "Password saat ini salah" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(passwordBaru, 12) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal mengganti password");
    return NextResponse.json({ error: message }, { status });
  }
}
