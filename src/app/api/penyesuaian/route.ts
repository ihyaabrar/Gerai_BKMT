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

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const penyesuaian = await prisma.penyesuaianStok.findMany({
      include: { barang: true },
      orderBy: { tanggal: "desc" },
      take: 200,
    });
    return NextResponse.json(penyesuaian);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat penyesuaian");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const barangId = requireString(body?.barangId, "Barang");
    const jenis = requireOneOf(body?.jenis, "Jenis", ["masuk", "keluar"] as const);
    const qty = requireInt(body?.qty, "Jumlah", { min: 1, max: 1000000 });
    const alasan = requireString(body?.alasan, "Alasan", { max: 500 });

    // Pencatatan dan perubahan stok dilakukan dalam satu transaksi agar
    // stok tidak pernah berubah tanpa jejak (atau sebaliknya).
    const penyesuaian = await prisma.$transaction(async (tx) => {
      const barang = await tx.barang.findUnique({ where: { id: barangId } });
      if (!barang) {
        throw new ValidationError("Barang tidak ditemukan");
      }
      if (jenis === "keluar" && barang.stok < qty) {
        throw new ValidationError(
          `Stok tidak mencukupi. Tersedia: ${barang.stok}`
        );
      }

      const created = await tx.penyesuaianStok.create({
        data: { barangId, jenis, qty, alasan },
        include: { barang: true },
      });

      await tx.barang.update({
        where: { id: barangId },
        data: { stok: jenis === "masuk" ? { increment: qty } : { decrement: qty } },
      });

      return created;
    });

    return NextResponse.json(penyesuaian);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan penyesuaian");
    return NextResponse.json({ error: message }, { status });
  }
}
