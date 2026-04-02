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
    const penjualanBulanIni = await prisma.penjualan.findMany({
      where: { tanggal: { gte: firstDayOfMonth } },
      include: { detail: { include: { barang: true } } },
    });
    let labaBulanIni = 0;
    penjualanBulanIni.forEach((p) =>
      p.detail.forEach((d) => { labaBulanIni += (d.hargaJual - d.barang.hargaBeli) * d.qty; })
    );

    const totalBarang = await prisma.barang.count({ where: { aktif: true } });
    const stokRendah = await prisma.barang.count({
      where: { aktif: true, stok: { lte: 5 } },
    });

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
        p.detail.forEach((d) => { totalLaba += (d.hargaJual - d.barang.hargaBeli) * d.qty; })
      );

      chartData.push({ bulan: bulanNames[d.getMonth()], penjualan: totalPenjualan, laba: totalLaba });
    }

    return NextResponse.json({
      penjualanHariIni: penjualanHariIni._sum.total || 0,
      labaBulanIni,
      totalBarang,
      stokRendah,
      transaksiTerbaru,
      produkTerlaris: produkTerlaris.map((p) => ({
        ...barangTerlaris.find((b) => b.id === p.barangId)!,
        totalTerjual: p._sum.qty || 0,
      })),
      chartData,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
