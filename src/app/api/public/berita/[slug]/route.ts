import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const berita = await prisma.berita.findFirst({
      where: { slug: params.slug, status: "published" },
      include: { penulis: { select: { nama: true } } },
    });

    if (!berita) {
      return NextResponse.json({ error: "Berita tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: berita });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat berita" }, { status: 500 });
  }
}
