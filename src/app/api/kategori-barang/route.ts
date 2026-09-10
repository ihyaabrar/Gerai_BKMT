import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, requireAuth } from "@/lib/auth-middleware";
import { ValidationError, requireString, toErrorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const kategori = await prisma.kategoriBarang.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
    });
    return NextResponse.json(kategori);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat kategori");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const nama = requireString(body?.nama, "Nama kategori", { max: 100 });

    const existing = await prisma.kategoriBarang.findUnique({ where: { nama } });
    if (existing) {
      // Kategori yang pernah dihapus cukup diaktifkan kembali.
      if (!existing.aktif) {
        const restored = await prisma.kategoriBarang.update({
          where: { id: existing.id },
          data: { aktif: true },
        });
        return NextResponse.json(restored);
      }
      throw new ValidationError("Kategori sudah ada");
    }

    const kategori = await prisma.kategoriBarang.create({ data: { nama } });
    return NextResponse.json(kategori);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan kategori");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.kategoriBarang.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    await prisma.kategoriBarang.update({ where: { id }, data: { aktif: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menghapus kategori");
    return NextResponse.json({ error: message }, { status });
  }
}
