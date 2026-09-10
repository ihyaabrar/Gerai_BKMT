import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { toErrorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * Export seluruh data sebagai satu file JSON yang langsung diunduh browser.
 *
 * Versi sebelumnya menyalin file `prisma/dev.db` — sisa dari masa SQLite.
 * Database sekarang PostgreSQL dan aplikasi umumnya berjalan di lingkungan
 * serverless yang filesystem-nya tidak persisten, jadi pendekatan itu
 * tidak akan pernah berhasil.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const [
      barang,
      member,
      nasabah,
      supplier,
      penjualan,
      pengeluaran,
      penyesuaian,
      retur,
      shift,
      pengaturan,
      kategoriBarang,
      kategoriPengeluaran,
      user,
    ] = await Promise.all([
      prisma.barang.findMany(),
      prisma.member.findMany(),
      prisma.nasabah.findMany(),
      prisma.supplier.findMany(),
      prisma.penjualan.findMany({ include: { detail: true } }),
      prisma.pengeluaran.findMany(),
      prisma.penyesuaianStok.findMany(),
      prisma.retur.findMany(),
      prisma.shiftKasir.findMany(),
      prisma.pengaturan.findMany(),
      prisma.kategoriBarang.findMany(),
      prisma.kategoriPengeluaran.findMany(),
      // Password sengaja tidak diikutkan dalam file backup.
      prisma.user.findMany({
        select: {
          id: true,
          nama: true,
          username: true,
          role: true,
          aktif: true,
          createdAt: true,
        },
      }),
    ]);

    const payload = {
      meta: {
        aplikasi: "Gerai BKMT",
        versi: 1,
        dibuatPada: new Date().toISOString(),
        dibuatOleh: auth.user.username,
      },
      data: {
        user,
        barang,
        kategoriBarang,
        kategoriPengeluaran,
        member,
        nasabah,
        supplier,
        penjualan,
        pengeluaran,
        penyesuaian,
        retur,
        shift,
        pengaturan,
      },
    };

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-gerai-bkmt-${timestamp}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal membuat backup");
    return NextResponse.json({ error: message }, { status });
  }
}

/** Ringkasan jumlah baris per tabel, untuk ditampilkan di halaman backup. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const [barang, member, nasabah, supplier, penjualan, pengeluaran, retur, shift] =
      await Promise.all([
        prisma.barang.count(),
        prisma.member.count(),
        prisma.nasabah.count(),
        prisma.supplier.count(),
        prisma.penjualan.count(),
        prisma.pengeluaran.count(),
        prisma.retur.count(),
        prisma.shiftKasir.count(),
      ]);

    return NextResponse.json({
      statistik: { barang, member, nasabah, supplier, penjualan, pengeluaran, retur, shift },
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat statistik");
    return NextResponse.json({ error: message }, { status });
  }
}
