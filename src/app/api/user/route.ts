import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-middleware";
import bcrypt from "bcryptjs";
import {
  ValidationError,
  optionalBoolean,
  requireOneOf,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

const ROLE = ["master", "admin", "kasir"] as const;

/** Kolom yang boleh dikirim keluar — hash password tidak pernah ikut. */
const PILIH = {
  id: true,
  nama: true,
  username: true,
  role: true,
  aktif: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Pengelolaan akun hanya untuk role master.
 *
 * Admin sengaja tidak diberi akses: membuat atau menaikkan role pengguna
 * adalah jalur peningkatan hak akses, jadi dipegang satu peran saja.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["master"]);
  if (auth.error) return auth.error;

  try {
    const users = await prisma.user.findMany({
      select: PILIH,
      orderBy: [{ aktif: "desc" }, { nama: "asc" }],
    });
    return NextResponse.json(users);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat pengguna");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["master"]);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const nama = requireString(body?.nama, "Nama", { max: 100 });
    const username = requireString(body?.username, "Username", { max: 50 });
    const password = requireString(body?.password, "Password", { min: 8, max: 100 });
    const role = requireOneOf(body?.role, "Role", ROLE);

    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      throw new ValidationError(
        "Username hanya boleh berisi huruf, angka, titik, garis bawah, dan strip"
      );
    }

    const dipakai = await prisma.user.findUnique({ where: { username } });
    if (dipakai) {
      throw new ValidationError(`Username "${username}" sudah dipakai`);
    }

    const user = await prisma.user.create({
      data: {
        nama,
        username,
        password: await bcrypt.hash(password, 12),
        role,
        aktif: optionalBoolean(body?.aktif, true),
      },
      select: PILIH,
    });

    return NextResponse.json(user);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan pengguna");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRole(request, ["master"]);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = requireString(body?.id, "ID pengguna");

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body?.nama !== undefined) {
      data.nama = requireString(body.nama, "Nama", { max: 100 });
    }

    if (body?.role !== undefined) {
      const role = requireOneOf(body.role, "Role", ROLE);
      // Jangan sampai tidak tersisa satu pun master yang aktif.
      if (existing.role === "master" && role !== "master") {
        await pastikanMasterTersisa(id);
      }
      data.role = role;
    }

    if (body?.aktif !== undefined) {
      const aktif = optionalBoolean(body.aktif, existing.aktif);
      if (!aktif) {
        if (existing.id === auth.user.id) {
          throw new ValidationError("Anda tidak bisa menonaktifkan akun sendiri");
        }
        if (existing.role === "master") await pastikanMasterTersisa(id);
      }
      data.aktif = aktif;
    }

    if (body?.password) {
      const password = requireString(body.password, "Password", { min: 8, max: 100 });
      data.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: data as any,
      select: PILIH,
    });

    return NextResponse.json(user);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memperbarui pengguna");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole(request, ["master"]);
  if (auth.error) return auth.error;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    if (existing.id === auth.user.id) {
      throw new ValidationError("Anda tidak bisa menonaktifkan akun sendiri");
    }
    if (existing.role === "master") await pastikanMasterTersisa(id);

    // Dinonaktifkan, bukan dihapus — shift dan riwayat tetap punya pemilik.
    await prisma.user.update({ where: { id }, data: { aktif: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menonaktifkan pengguna");
    return NextResponse.json({ error: message }, { status });
  }
}

async function pastikanMasterTersisa(kecualiId: string) {
  const sisa = await prisma.user.count({
    where: { role: "master", aktif: true, id: { not: kecualiId } },
  });
  if (sisa === 0) {
    throw new ValidationError(
      "Harus ada minimal satu akun master yang aktif. Tunjuk master lain terlebih dahulu."
    );
  }
}
