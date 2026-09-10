import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, requireAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  requireNumber,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const kategori = searchParams.get("kategori")?.trim();
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (startDate && endDate) {
      where.tanggal = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    if (kategori) where.kategori = kategori;
    if (search) where.keterangan = { contains: search, mode: "insensitive" };

    const pengeluaran = await prisma.pengeluaran.findMany({
      where,
      orderBy: { tanggal: "desc" },
    });
    return NextResponse.json(pengeluaran);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat pengeluaran");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const kategori = requireString(body?.kategori, "Kategori", { max: 100 });
    const keterangan = requireString(body?.keterangan, "Keterangan", { max: 500 });
    const jumlah = requireNumber(body?.jumlah, "Jumlah", { min: 1 });

    const tanggal = body?.tanggal ? new Date(body.tanggal) : new Date();
    if (Number.isNaN(tanggal.getTime())) {
      throw new ValidationError("Tanggal tidak valid");
    }

    const pengeluaran = await prisma.pengeluaran.create({
      data: { tanggal, kategori, keterangan, jumlah },
    });
    return NextResponse.json(pengeluaran);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan pengeluaran");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  // Pengeluaran dihapus permanen, jadi dibatasi ke master/admin.
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.pengeluaran.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengeluaran tidak ditemukan" }, { status: 404 });
    }

    await prisma.pengeluaran.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menghapus pengeluaran");
    return NextResponse.json({ error: message }, { status });
  }
}
