import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import {
  optionalBoolean,
  optionalString,
  requireInt,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const galeri = await prisma.galeri.findMany({
      orderBy: [{ urutan: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ data: galeri });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat galeri");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const galeri = await prisma.galeri.create({
      data: {
        judul: requireString(body?.judul, "Judul", { max: 150 }),
        gambarUrl: requireString(body?.gambarUrl, "Gambar", { max: 500 }),
        deskripsi: optionalString(body?.deskripsi, "Deskripsi", { max: 500 }),
        kategori: optionalString(body?.kategori, "Kategori", { max: 60 }),
        urutan:
          body?.urutan === undefined ? 0 : requireInt(body.urutan, "Urutan", { min: 0 }),
        aktif: optionalBoolean(body?.aktif, true),
      },
    });
    return NextResponse.json({ data: galeri });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan galeri");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = requireString(body?.id, "ID galeri");

    const existing = await prisma.galeri.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body?.judul !== undefined)
      data.judul = requireString(body.judul, "Judul", { max: 150 });
    if (body?.gambarUrl !== undefined)
      data.gambarUrl = requireString(body.gambarUrl, "Gambar", { max: 500 });
    if (body?.deskripsi !== undefined)
      data.deskripsi = optionalString(body.deskripsi, "Deskripsi", { max: 500 });
    if (body?.kategori !== undefined)
      data.kategori = optionalString(body.kategori, "Kategori", { max: 60 });
    if (body?.urutan !== undefined)
      data.urutan = requireInt(body.urutan, "Urutan", { min: 0 });
    if (body?.aktif !== undefined)
      data.aktif = optionalBoolean(body.aktif, existing.aktif);

    const galeri = await prisma.galeri.update({ where: { id }, data: data as any });
    return NextResponse.json({ data: galeri });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memperbarui galeri");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.galeri.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
    }

    await prisma.galeri.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menghapus foto");
    return NextResponse.json({ error: message }, { status });
  }
}
