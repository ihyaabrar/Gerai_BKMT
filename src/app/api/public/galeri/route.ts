import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Galeri untuk halaman publik — hanya foto yang diaktifkan. */
export async function GET() {
  try {
    const galeri = await prisma.galeri.findMany({
      where: { aktif: true },
      orderBy: [{ urutan: "asc" }, { createdAt: "desc" }],
      take: 24,
      select: {
        id: true,
        judul: true,
        deskripsi: true,
        gambarUrl: true,
        kategori: true,
      },
    });
    return NextResponse.json({ data: galeri });
  } catch {
    return NextResponse.json({ error: "Gagal memuat galeri" }, { status: 500 });
  }
}
