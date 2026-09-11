import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import { labelPeriode, periodeValid, rentangPeriode } from "@/lib/keuangan";
import { ValidationError, toErrorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * Batas ukuran respons Vercel sekitar 4,5 MB. Ambang di bawahnya dipakai agar
 * kegagalan terjadi di sini — dengan pesan yang menjelaskan jalan keluarnya —
 * bukan sebagai FUNCTION_PAYLOAD_TOO_LARGE yang muncul ke pengurus sebagai
 * "Gagal membuat backup" tanpa keterangan apa pun.
 */
const BATAS_BYTE = 3_500_000;

/**
 * Ekspor data sebagai satu berkas JSON yang langsung diunduh peramban.
 *
 * Ini BUKAN strategi pemulihan bencana utama. Backup yang bergantung pada
 * seseorang menekan tombol setiap minggu adalah backup yang tidak ada.
 * Andalkan point-in-time restore bawaan penyedia database; berkas ini untuk
 * arsip dan pemeriksaan manual.
 *
 * Tanpa parameter, seluruh data diekspor. Dengan `?periode=YYYY-MM`, hanya
 * transaksi bulan itu — inilah yang biasanya benar-benar dibutuhkan pengurus,
 * dan ukurannya tidak pernah mendekati batas.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const periode = new URL(request.url).searchParams.get("periode");
    if (periode && !periodeValid(periode)) {
      throw new ValidationError("Periode harus berformat YYYY-MM, misalnya 2026-09");
    }

    // Data transaksional disaring per periode; data induk (barang, member,
    // nasabah, pengaturan) selalu ikut penuh karena tanpa itu berkasnya tidak
    // bisa dibaca sendiri.
    const rentang = periode ? rentangPeriode(periode) : null;
    const saring = rentang
      ? { tanggal: { gte: rentang.mulai, lte: rentang.selesai } }
      : {};
    const saringShift = rentang
      ? { jamBuka: { gte: rentang.mulai, lte: rentang.selesai } }
      : {};

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
      distribusi,
      pengaturan,
      kategoriBarang,
      kategoriPengeluaran,
      user,
    ] = await Promise.all([
      prisma.barang.findMany(),
      prisma.member.findMany(),
      prisma.nasabah.findMany(),
      prisma.supplier.findMany(),
      prisma.penjualan.findMany({ where: saring, include: { detail: true } }),
      prisma.pengeluaran.findMany({ where: saring }),
      prisma.penyesuaianStok.findMany({ where: saring }),
      prisma.retur.findMany({ where: saring }),
      prisma.shiftKasir.findMany({ where: saringShift }),
      // Rekaman bagi hasil ikut diekspor: inilah yang menjawab pertanyaan
      // anggota tentang pembagian bulan-bulan sebelumnya.
      prisma.distribusiLaba.findMany({
        where: periode ? { periode } : {},
        include: { detail: true },
      }),
      prisma.pengaturan.findMany(),
      prisma.kategoriBarang.findMany(),
      prisma.kategoriPengeluaran.findMany(),
      // Password sengaja tidak diikutkan dalam berkas ekspor.
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
        versi: 2,
        periode: periode ?? "semua",
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
        distribusi,
        pengaturan,
      },
    };

    // Tanpa indentasi: berkas yang sama, sekitar 30% lebih kecil. Berkas ini
    // dibaca mesin, bukan manusia.
    const isi = JSON.stringify(payload);
    const ukuran = Buffer.byteLength(isi, "utf8");

    if (ukuran > BATAS_BYTE) {
      throw new ValidationError(
        `Data terlalu besar untuk diekspor sekaligus (${(ukuran / 1_000_000).toFixed(1)} MB). ` +
          `Ekspor per bulan saja — pilih periodenya di halaman ini.`
      );
    }

    const namaBerkas = periode
      ? `gerai-bkmt-${periode}.json`
      : `gerai-bkmt-semua-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(isi, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${namaBerkas}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal mengekspor data", {
      endpoint: "/api/backup",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}

/** Ringkasan jumlah baris per tabel, untuk ditampilkan di halaman ekspor. */
export async function POST(request: NextRequest) {
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
      retur,
      shift,
      distribusi,
    ] = await Promise.all([
      prisma.barang.count(),
      prisma.member.count(),
      prisma.nasabah.count(),
      prisma.supplier.count(),
      prisma.penjualan.count(),
      prisma.pengeluaran.count(),
      prisma.retur.count(),
      prisma.shiftKasir.count(),
      prisma.distribusiLaba.count(),
    ]);

    return NextResponse.json({
      statistik: {
        barang,
        member,
        nasabah,
        supplier,
        penjualan,
        pengeluaran,
        retur,
        shift,
        distribusi,
      },
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat statistik", {
      endpoint: "/api/backup",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
