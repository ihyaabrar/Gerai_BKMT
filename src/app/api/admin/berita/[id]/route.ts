import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { applyPublishLogic } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const berita = await prisma.berita.findUnique({
      where: { id: params.id },
      include: { penulis: { select: { nama: true } } },
    });
    if (!berita) return NextResponse.json({ error: "Berita tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ data: berita });
  } catch {
    return NextResponse.json({ error: "Gagal memuat berita" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.judul?.trim()) return NextResponse.json({ error: "Judul tidak boleh kosong" }, { status: 400 });
    if (!body.konten?.trim()) return NextResponse.json({ error: "Konten tidak boleh kosong" }, { status: 400 });

    const { id: _id, slug: _slug, penulisId: _p, penulis: _pn, createdAt: _c, updatedAt: _u, ...updateData } = body;
    const data = applyPublishLogic({ ...updateData, tanggalPublikasi: body.tanggalPublikasi ?? null });

    const berita = await prisma.berita.update({
      where: { id: params.id },
      data,
      include: { penulis: { select: { nama: true } } },
    });
    return NextResponse.json({ data: berita });
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate berita" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    await prisma.berita.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus berita" }, { status: 500 });
  }
}
