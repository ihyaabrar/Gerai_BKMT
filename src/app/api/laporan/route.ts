import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type") || "penjualan";

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (type === "penjualan") {
      const penjualan = await prisma.penjualan.findMany({
        where: {
          tanggal: {
            gte: start,
            lte: end,
          },
        },
        include: {
          detail: {
            include: {
              barang: true,
            },
          },
          member: true,
        },
        orderBy: { tanggal: "desc" },
      });

      const totalPenjualan = penjualan.reduce((sum, p) => sum + p.total, 0);
      const totalTransaksi = penjualan.length;

      let totalLaba = 0;
      penjualan.forEach((p) => {
        p.detail.forEach((d) => {
          const laba = (d.hargaJual - d.barang.hargaBeli) * d.qty;
          totalLaba += laba;
        });
      });

      // Produk terlaris
      const produkMap = new Map();
      penjualan.forEach((p) => {
        p.detail.forEach((d) => {
          const existing = produkMap.get(d.barangId) || {
            nama: d.barang.nama,
            qty: 0,
            total: 0,
          };
          existing.qty += d.qty;
          existing.total += d.subtotal;
          produkMap.set(d.barangId, existing);
        });
      });

      const produkTerlaris = Array.from(produkMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);

      // Penjualan per hari
      const penjualanPerHari = new Map();
      penjualan.forEach((p) => {
        const date = p.tanggal.toISOString().split("T")[0];
        const existing = penjualanPerHari.get(date) || 0;
        penjualanPerHari.set(date, existing + p.total);
      });

      const chartData = Array.from(penjualanPerHari.entries())
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return NextResponse.json({
        totalPenjualan,
        totalTransaksi,
        totalLaba,
        produkTerlaris,
        chartData,
        penjualan,
      });
    } else if (type === "pengeluaran") {
      const pengeluaran = await prisma.pengeluaran.findMany({
        where: {
          tanggal: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { tanggal: "desc" },
      });

      const totalPengeluaran = pengeluaran.reduce((sum, p) => sum + p.jumlah, 0);

      // Pengeluaran per kategori
      const kategoriMap = new Map();
      pengeluaran.forEach((p) => {
        const existing = kategoriMap.get(p.kategori) || 0;
        kategoriMap.set(p.kategori, existing + p.jumlah);
      });

      const pengeluaranPerKategori = Array.from(kategoriMap.entries()).map(
        ([kategori, jumlah]) => ({ kategori, jumlah })
      );

      return NextResponse.json({
        totalPengeluaran,
        pengeluaranPerKategori,
        pengeluaran,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
