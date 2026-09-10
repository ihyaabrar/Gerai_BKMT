import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import {
  optionalString,
  requireNumber,
  requireString,
  toErrorResponse,
} from "@/lib/validate";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Persentase bagi hasil dihitung ulang untuk semua nasabah aktif.
 * Dijalankan di dalam transaksi supaya total persentase tidak pernah
 * terlihat setengah jadi oleh request lain.
 */
async function rebalancePersentase(tx: Prisma.TransactionClient) {
  const semua = await tx.nasabah.findMany({ where: { aktif: true } });
  const total = semua.reduce((sum, n) => sum + n.jumlahInvestasi, 0);

  for (const n of semua) {
    await tx.nasabah.update({
      where: { id: n.id },
      data: { persentase: total === 0 ? 0 : (n.jumlahInvestasi / total) * 100 },
    });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const nasabah = await prisma.nasabah.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
    });
    return NextResponse.json(nasabah);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat nasabah");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const nama = requireString(body?.nama, "Nama nasabah", { max: 150 });
    const jumlahInvestasi = requireNumber(body?.jumlahInvestasi, "Jumlah investasi", { min: 1 });
    const telepon = optionalString(body?.telepon, "Telepon", { max: 30 });
    const alamat = optionalString(body?.alamat, "Alamat", { max: 500 });

    const nasabah = await prisma.$transaction(async (tx) => {
      const created = await tx.nasabah.create({
        data: { nama, telepon, alamat, jumlahInvestasi, persentase: 0 },
      });
      await rebalancePersentase(tx);
      // Baca ulang supaya persentase hasil rebalance ikut terkirim.
      return tx.nasabah.findUnique({ where: { id: created.id } });
    });

    return NextResponse.json(nasabah);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menyimpan nasabah");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = requireString(body?.id, "ID nasabah");
    const nama = requireString(body?.nama, "Nama nasabah", { max: 150 });
    const jumlahInvestasi = requireNumber(body?.jumlahInvestasi, "Jumlah investasi", { min: 1 });
    const telepon = optionalString(body?.telepon, "Telepon", { max: 30 });
    const alamat = optionalString(body?.alamat, "Alamat", { max: 500 });

    const existing = await prisma.nasabah.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Nasabah tidak ditemukan" }, { status: 404 });
    }

    const nasabah = await prisma.$transaction(async (tx) => {
      await tx.nasabah.update({
        where: { id },
        data: { nama, telepon, alamat, jumlahInvestasi },
      });
      await rebalancePersentase(tx);
      return tx.nasabah.findUnique({ where: { id } });
    });

    return NextResponse.json(nasabah);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memperbarui nasabah");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.nasabah.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Nasabah tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.nasabah.update({ where: { id }, data: { aktif: false } });
      await rebalancePersentase(tx);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal menghapus nasabah");
    return NextResponse.json({ error: message }, { status });
  }
}
