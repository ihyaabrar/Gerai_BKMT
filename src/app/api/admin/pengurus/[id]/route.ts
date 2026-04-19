import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const pengurus = await prisma.pengurus.findUnique({ where: { id: params.id } });
    if (!pengurus) return NextResponse.json({ error: "Pengurus tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ data: pengurus });
  } catch {
    return NextResponse.json({ error: "Gagal memuat pengurus" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    if (!body.nama?.trim()) return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
    if (!body.jabatan?.trim()) return NextResponse.json({ error: "Jabatan tidak boleh kosong" }, { status: 400 });
    if (body.tingkatan && !["PD", "PC", "Permata"].includes(body.tingkatan)) {
      return NextResponse.json({ error: "Tingkatan harus PD, PC, atau Permata" }, { status: 400 });
    }

    const { id: _id, createdAt: _c, updatedAt: _u, ...data } = body;
    const pengurus = await prisma.pengurus.update({ where: { id: params.id }, data });
    return NextResponse.json({ data: pengurus });
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate pengurus" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    await prisma.pengurus.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus pengurus" }, { status: 500 });
  }
}
