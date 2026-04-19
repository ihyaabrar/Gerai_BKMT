import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.aktif) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Cek apakah password sudah di-hash (bcrypt hash dimulai dengan $2)
    let isValid = false;
    if (user.password.startsWith("$2")) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Fallback untuk password lama (plain text) — lalu hash ulang
      isValid = user.password === password;
      if (isValid) {
        const hashed = await bcrypt.hash(password, 12);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}
