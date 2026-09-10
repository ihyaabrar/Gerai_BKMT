import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import {
  ValidationError,
  requireInt,
  requireOneOf,
  requireString,
  toErrorResponse,
} from "@/lib/validate";

export const dynamic = "force-dynamic";

const STATUS = ["proses", "selesai", "batal"] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const status = new URL(request.url).searchParams.get("status");
    const where = status && STATUS.includes(status as any) ? { status } : {};

    const retur = await prisma.retur.findMany({
      where,
      include: { barang: true },
      orderBy: { tanggal: "desc" },
      take: 200,
    });
    return NextResponse.json(retur);
  } catch (error) {
    const { message, status: code } = toErrorResponse(error, "Gagal memuat retur");
    return NextResponse.json({ error: message }, { status: code });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const barangId = requireString(body?.barangId, "Barang");
    const qty = requireInt(body?.qty, "Jumlah", { min: 1, max: 1000000 });
    const alasan = requireString(body?.alasan, "Alasan", { max: 500 });

    const barang = await prisma.barang.findUnique({ where: { id: barangId } });
    if (!barang) {
      return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
    }
    if (barang.stok < qty) {
      throw new ValidationError(`Stok tidak mencukupi untuk retur. Tersedia: ${barang.stok}`);
    }

    // Stok baru dipotong saat retur diselesaikan (lihat PATCH).
    const retur = await prisma.retur.create({
      data: { barangId, qty, alasan, tanggal: new Date(), status: "proses" },
      include: { barang: true },
    });

    return NextResponse.json(retur);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal membuat retur");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = requireString(body?.id, "ID retur");
    const status = requireOneOf(body?.status, "Status", STATUS);

    const retur = await prisma.$transaction(async (tx) => {
      const existing = await tx.retur.findUnique({ where: { id } });
      if (!existing) {
        throw new ValidationError("Retur tidak ditemukan");
      }
      if (existing.status === "selesai" && status !== "selesai") {
        throw new ValidationError("Retur yang sudah selesai tidak bisa diubah lagi");
      }

      // Pemotongan stok hanya terjadi sekali, saat transisi ke "selesai".
      if (status === "selesai" && existing.status !== "selesai") {
        const barang = await tx.barang.findUnique({ where: { id: existing.barangId } });
        if (!barang) {
          throw new ValidationError("Barang tidak ditemukan");
        }
        if (barang.stok < existing.qty) {
          throw new ValidationError(`Stok tidak mencukupi. Tersedia: ${barang.stok}`);
        }
        await tx.barang.update({
          where: { id: existing.barangId },
          data: { stok: { decrement: existing.qty } },
        });
      }

      return tx.retur.update({
        where: { id },
        data: { status },
        include: { barang: true },
      });
    });

    return NextResponse.json(retur);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memperbarui retur");
    return NextResponse.json({ error: message }, { status });
  }
}
