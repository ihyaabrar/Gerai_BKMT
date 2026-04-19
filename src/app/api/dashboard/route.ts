import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const penjualanHariIni = await prisma.penjualan.aggregate({
      where: { tanggal: { gte: today } },
      _sum: { total: true },
    });

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Laba kotor bulan ini = (harga jual - harga beli) × qty
    const penjualanBulanIni = await prisma.penjualan.findMany({
      where: { tanggal: { gte: firstDayOfMonth } },
      include: { detail: { include: { barang: true } } },
    });
    let labaKotor = 0;
    penjualanBulanIni.forEach((p) =>
      p.detail.forEach((d) => {
        labaKotor += (d.hargaJual - d.barang.hargaBeli) * d.qty;
      })
    );

    // Pengeluaran operasional bulan ini (selain pembelian barang)
    const pengeluaranBulanIni = await prisma.pengeluaran.aggregate({
      where: {
        tanggal: { gte: firstDayOfMonth },
        kategori: { not: "Pembelian Barang" },
      },
      _sum: { jumlah: true },
    });
    const totalPengeluaranOps = pengeluaranBulanIni._sum.jumlah || 0;
    const labaBersih = labaKotor - totalPengeluaranOps;

    const totalBarang = await prisma.barang.count({ where: { aktif: true } });

    // Ambil semua barang aktif lalu filter di JS (lebih aman untuk SQLite)
    const semuaBarang = await prisma.barang.findMany({
      where: { aktif: true },
      select: { id: true, nama: true, kode: true, stok: true, stokMinimum: true, satuan: true },
      orderBy: { stok: "asc" },
    });

    // Barang yang stok-nya <= stokMinimum (per barang, bukan hardcode)
    const barangStokRendah = semuaBarang.filter((b) => b.stok <= b.stokMinimum);
    const barangStokHabis = semuaBarang.filter((b) => b.stok === 0);

    // Gabungkan untuk alert (habis + rendah), max 10
    const barangPerluRestock = [
      ...barangStokHabis,
      ...barangStokRendah.filter((b) => b.stok > 0),
    ].slice(0, 10);

    const transaksiTerbaru = await prisma.penjualan.findMany({
      take: 5,
      orderBy: { tanggal: "desc" },
      include: { member: true },
    });

    const produkTerlaris = await prisma.detailPenjualan.groupBy({
      by: ["barangId"],
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    });
    const barangTerlaris = await prisma.barang.findMany({
      where: { id: { in: produkTerlaris.map((p) => p.barangId) } },
    });

    const bulanNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const chartData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const penjualan = await prisma.penjualan.findMany({
        where: { tanggal: { gte: start, lte: end } },
        include: { detail: { include: { barang: true } } },
      });

      const totalPenjualan = penjualan.reduce((s, p) => s + p.total, 0);
      let totalLaba = 0;
      penjualan.forEach((p) =>
        p.detail.forEach((d) => {
          totalLaba += (d.hargaJual - d.barang.hargaBeli) * d.qty;
        })
      );

      chartData.push({ bulan: bulanNames[d.getMonth()], penjualan: totalPenjualan, laba: totalLaba });
    }

    return NextResponse.json({
      penjualanHariIni: penjualanHariIni._sum.total || 0,
      labaKotor,
      labaBersih,
      totalPengeluaranOps,
      totalBarang,
      stokRendah: barangStokRendah.length,
      barangStokRendah: barangPerluRestock,
      transaksiTerbaru,
      produkTerlaris: produkTerlaris.map((p) => ({
        ...barangTerlaris.find((b) => b.id === p.barangId)!,
        totalTerjual: p._sum.qty || 0,
      })),
      chartData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
