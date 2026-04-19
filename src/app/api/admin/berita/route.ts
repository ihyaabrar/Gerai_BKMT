import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { generateSlug, ensureUniqueSlug, applyPublishLogic } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const berita = await prisma.berita.findMany({
      orderBy: { createdAt: "desc" },
      include: { penulis: { select: { nama: true } } },
    });
    return NextResponse.json({ data: berita });
  } catch {
    return NextResponse.json({ error: "Gagal memuat berita" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { judul, konten, ringkasan, gambarUrl, status } = body;

    if (!judul?.trim()) return NextResponse.json({ error: "Judul tidak boleh kosong" }, { status: 400 });
    if (!konten?.trim()) return NextResponse.json({ error: "Konten tidak boleh kosong" }, { status: 400 });

    // Generate slug unik
    const baseSlug = generateSlug(judul);
    const existingSlugs = (await prisma.berita.findMany({ select: { slug: true } })).map((b) => b.slug);
    const slug = ensureUniqueSlug(baseSlug, existingSlugs);

    // Cek duplikat slug (race condition guard)
    const existing = await prisma.berita.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug sudah digunakan, coba judul yang berbeda" }, { status: 409 });
    }

    const data = applyPublishLogic({ judul, konten, ringkasan, gambarUrl, status: status || "draft", slug, tanggalPublikasi: body.tanggalPublikasi ?? null });

    const berita = await prisma.berita.create({
      data: { ...data, penulisId: auth.user.id },
      include: { penulis: { select: { nama: true } } },
    });
    return NextResponse.json({ data: berita }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal membuat berita" }, { status: 500 });
  }
}
