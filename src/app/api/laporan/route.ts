import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-middleware";
import {
  KATEGORI_PEMBELIAN_BARANG,
  PENJUALAN_SAH,
  akhirHariWIB,
  awalHariWIB,
  tanggalWIB,
  hitungKerugianStok,
  hitungLaba,
  labaTransaksi,
  periodeDari,
  rentangPeriode,
} from "@/lib/keuangan";
import { toErrorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

/** Rentang lebih panjang dari ini ditolak; laporan setahun sudah cukup jauh. */
const MAKS_HARI = 366;

async function laporanPenjualan(start: Date, end: Date) {
  const penjualan = await prisma.penjualan.findMany({
    where: { ...PENJUALAN_SAH, tanggal: { gte: start, lte: end } },
    orderBy: { tanggal: "desc" },
    select: {
      id: true,
      tanggal: true,
      total: true,
      diskon: true,
      // Hanya kolom yang benar-benar dipakai. Sebelumnya seluruh objek Barang
      // ikut terkirim untuk setiap baris detail, berulang-ulang, sehingga
      // laporan setahun bisa menembus batas ukuran respons Vercel.
      detail: {
        select: {
          barangId: true,
          qty: true,
          subtotal: true,
          hargaBeli: true,
          barang: { select: { nama: true } },
        },
      },
    },
  });

  const { totalPenjualan, totalHpp, totalDiskon, labaKotor } = hitungLaba(penjualan);

  // Nilai barang rusak/hilang pada rentang yang sama — dasar yang sama dengan
  // Distribusi Laba, supaya "laba yang dibagi" di kedua halaman tidak berbeda.
  const penyesuaian = await prisma.penyesuaianStok.findMany({
    where: { tanggal: { gte: start, lte: end } },
    select: { jenis: true, qty: true, hargaBeli: true },
  });
  const kerugianStok = hitungKerugianStok(penyesuaian);

  const produkMap = new Map<string, { nama: string; qty: number; total: number }>();
  for (const p of penjualan) {
    for (const d of p.detail) {
      const ex = produkMap.get(d.barangId) ?? { nama: d.barang.nama, qty: 0, total: 0 };
      ex.qty += d.qty;
      ex.total += d.subtotal;
      produkMap.set(d.barangId, ex);
    }
  }
  const produkTerlaris = Array.from(produkMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Pengelompokan harian mengikuti kalender WIB, bukan zona waktu server.
  const hariMap = new Map<string, { total: number; laba: number }>();
  for (const p of penjualan) {
    const kunci = tanggalWIB(p.tanggal);
    const entry = hariMap.get(kunci) ?? { total: 0, laba: 0 };
    entry.total += p.total;
    entry.laba += labaTransaksi(p);
    hariMap.set(kunci, entry);
  }
  const chartData = Array.from(hariMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    totalPenjualan,
    totalTransaksi: penjualan.length,
    totalHpp,
    totalDiskon,
    // "Laba" di seluruh aplikasi berarti satu hal: uang diterima dikurangi
    // harga pokok yang dibekukan. Diskon sudah otomatis terpotong karena
    // yang dijumlahkan adalah `total`, bukan subtotal.
    totalLaba: labaKotor,
    kerugianStok,
    labaDibagi: labaKotor - kerugianStok,
    produkTerlaris,
    chartData,
  });
}

async function laporanPengeluaran(start: Date, end: Date) {
  const pengeluaran = await prisma.pengeluaran.findMany({
    where: { tanggal: { gte: start, lte: end } },
    orderBy: { tanggal: "desc" },
    select: { id: true, tanggal: true, kategori: true, keterangan: true, jumlah: true },
  });

  let totalPengeluaran = 0;
  let totalPembelianBarang = 0;
  const kategoriMap = new Map<string, number>();

  for (const p of pengeluaran) {
    totalPengeluaran += p.jumlah;
    if (p.kategori === KATEGORI_PEMBELIAN_BARANG) totalPembelianBarang += p.jumlah;
    kategoriMap.set(p.kategori, (kategoriMap.get(p.kategori) ?? 0) + p.jumlah);
  }

  return NextResponse.json({
    totalPengeluaran,
    totalPembelianBarang,
    // Angka inilah yang boleh dikurangkan dari laba. Pembelian barang dagangan
    // sudah terhitung sebagai harga pokok pada setiap penjualan; menguranginya
    // sekali lagi berarti menghitung modal barang dua kali.
    totalPengeluaranOperasional: totalPengeluaran - totalPembelianBarang,
    pengeluaranPerKategori: Array.from(kategoriMap.entries()).map(
      ([kategori, jumlah]) => ({ kategori, jumlah })
    ),
    pengeluaran,
  });
}

export async function GET(request: NextRequest) {
  // Laporan keuangan hanya untuk master/admin.
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type") || "penjualan";

    if (type !== "penjualan" && type !== "pengeluaran") {
      return NextResponse.json({ error: "Jenis laporan tidak dikenal" }, { status: 400 });
    }

    let start: Date;
    let end: Date;

    if (!startDate || !endDate) {
      // Tanpa parameter, laporan menampilkan bulan berjalan menurut kalender WIB.
      ({ mulai: start, selesai: end } = rentangPeriode(periodeDari(new Date())));
    } else {
      const mulai = new Date(startDate);
      const selesai = new Date(endDate);
      if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime())) {
        return NextResponse.json({ error: "Rentang tanggal tidak valid" }, { status: 400 });
      }
      start = awalHariWIB(mulai);
      end = akhirHariWIB(selesai);
    }

    if (start > end) {
      return NextResponse.json(
        { error: "Tanggal awal tidak boleh melewati tanggal akhir" },
        { status: 400 }
      );
    }
    if (end.getTime() - start.getTime() > MAKS_HARI * 24 * 3600_000) {
      return NextResponse.json(
        { error: `Rentang laporan maksimal ${MAKS_HARI} hari` },
        { status: 400 }
      );
    }

    return type === "penjualan"
      ? laporanPenjualan(start, end)
      : laporanPengeluaran(start, end);
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal membuat laporan", {
      endpoint: "/api/laporan",
      userId: auth.user?.id,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
