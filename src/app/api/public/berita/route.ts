import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const berita = await prisma.berita.findMany({
      where: { status: "published" },
      orderBy: { tanggalPublikasi: "desc" },
      select: {
        id: true,
        judul: true,
        slug: true,
        ringkasan: true,
        gambarUrl: true,
        tanggalPublikasi: true,
        penulis: { select: { nama: true } },
      },
      take: 20,
    });
    return NextResponse.json({ data: berita });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat berita" }, { status: 500 });
  }
}
