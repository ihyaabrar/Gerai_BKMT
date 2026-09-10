import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { toErrorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const awalGrafik = new Date(today.getFullYear(), today.getMonth() - 11, 1);

    const [
      penjualanHariIni,
      penjualan12Bulan,
      pengeluaranBulanIni,
      totalBarang,
      semuaBarang,
      transaksiTerbaru,
      produkTerlaris,
    ] = await Promise.all([
      prisma.penjualan.aggregate({
        where: { tanggal: { gte: today } },
        _sum: { total: true },
      }),
      // Satu query untuk 12 bulan, menggantikan 12 query berurutan di dalam loop.
      prisma.penjualan.findMany({
        where: { tanggal: { gte: awalGrafik } },
        include: { detail: { include: { barang: { select: { hargaBeli: true } } } } },
      }),
      prisma.pengeluaran.aggregate({
        where: {
          tanggal: { gte: firstDayOfMonth },
          kategori: { not: "Pembelian Barang" },
        },
        _sum: { jumlah: true },
      }),
      prisma.barang.count({ where: { aktif: true } }),
      prisma.barang.findMany({
        where: { aktif: true },
        select: {
          id: true,
          nama: true,
          kode: true,
          stok: true,
          stokMinimum: true,
          satuan: true,
        },
        orderBy: { stok: "asc" },
      }),
      prisma.penjualan.findMany({
        take: 5,
        orderBy: { tanggal: "desc" },
        include: { member: true },
      }),
      prisma.detailPenjualan.groupBy({
        by: ["barangId"],
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 5,
      }),
    ]);

    const labaTransaksi = (p: (typeof penjualan12Bulan)[number]) =>
      p.detail.reduce((sum, d) => sum + (d.hargaJual - d.barang.hargaBeli) * d.qty, 0);

    const penjualanBulanIni = penjualan12Bulan.filter((p) => p.tanggal >= firstDayOfMonth);
    const labaKotor = penjualanBulanIni.reduce((sum, p) => sum + labaTransaksi(p), 0);

    const totalPengeluaranOps = pengeluaranBulanIni._sum.jumlah || 0;

    // Kelompokkan 12 bulan terakhir berdasarkan kunci tahun-bulan.
    const perBulan = new Map<string, { penjualan: number; laba: number }>();
    for (const p of penjualan12Bulan) {
      const key = `${p.tanggal.getFullYear()}-${p.tanggal.getMonth()}`;
      const entry = perBulan.get(key) ?? { penjualan: 0, laba: 0 };
      entry.penjualan += p.total;
      entry.laba += labaTransaksi(p);
      perBulan.set(key, entry);
    }

    const chartData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const entry = perBulan.get(`${d.getFullYear()}-${d.getMonth()}`);
      chartData.push({
        bulan: BULAN[d.getMonth()],
        penjualan: entry?.penjualan ?? 0,
        laba: entry?.laba ?? 0,
      });
    }

    const barangStokRendah = semuaBarang.filter((b) => b.stok <= b.stokMinimum);
    const barangPerluRestock = [
      ...barangStokRendah.filter((b) => b.stok === 0),
      ...barangStokRendah.filter((b) => b.stok > 0),
    ].slice(0, 10);

    const barangTerlaris = await prisma.barang.findMany({
      where: { id: { in: produkTerlaris.map((p) => p.barangId) } },
    });

    return NextResponse.json({
      penjualanHariIni: penjualanHariIni._sum.total || 0,
      labaKotor,
      labaBersih: labaKotor - totalPengeluaranOps,
      totalPengeluaranOps,
      totalBarang,
      stokRendah: barangStokRendah.length,
      barangStokRendah: barangPerluRestock,
      transaksiTerbaru,
      // Barang yang sudah dihapus permanen dilewati, bukan bikin crash
      // seperti versi sebelumnya yang memakai non-null assertion.
      produkTerlaris: produkTerlaris.flatMap((p) => {
        const barang = barangTerlaris.find((b) => b.id === p.barangId);
        return barang ? [{ ...barang, totalTerjual: p._sum.qty || 0 }] : [];
      }),
      chartData,
    });
  } catch (error) {
    const { message, status } = toErrorResponse(error, "Gagal memuat dashboard");
    return NextResponse.json({ error: message }, { status });
  }
}
