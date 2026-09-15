import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { parsePengurus } from "@/lib/validasi-pengurus";
import { toErrorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(request);
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
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const data = parsePengurus(await request.json().catch(() => null), { sebagian: true });
    const pengurus = await prisma.pengurus.update({ where: { id: params.id }, data });
    return NextResponse.json({ data: pengurus });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal mengupdate pengurus");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    await prisma.pengurus.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus pengurus" }, { status: 500 });
  }
}
