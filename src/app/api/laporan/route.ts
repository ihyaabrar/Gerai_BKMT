import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function handleLaporan(type: string, start: Date, end: Date) {
  if (type === "penjualan") {
    const penjualan = await prisma.penjualan.findMany({
      where: { tanggal: { gte: start, lte: end } },
      include: { detail: { include: { barang: true } }, member: true },
      orderBy: { tanggal: "desc" },
    });

    const totalPenjualan = penjualan.reduce((sum, p) => sum + p.total, 0);
    const totalTransaksi = penjualan.length;

    let totalLaba = 0;
    penjualan.forEach((p) =>
      p.detail.forEach((d) => {
        totalLaba += (d.hargaJual - d.barang.hargaBeli) * d.qty;
      })
    );

    // Produk terlaris
    const produkMap = new Map<string, { nama: string; qty: number; total: number }>();
    penjualan.forEach((p) =>
      p.detail.forEach((d) => {
        const ex = produkMap.get(d.barangId) || { nama: d.barang.nama, qty: 0, total: 0 };
        ex.qty += d.qty;
        ex.total += d.subtotal;
        produkMap.set(d.barangId, ex);
      })
    );
    const produkTerlaris = Array.from(produkMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // Penjualan per hari
    const hariMap = new Map<string, number>();
    penjualan.forEach((p) => {
      const date = p.tanggal.toISOString().split("T")[0];
      hariMap.set(date, (hariMap.get(date) || 0) + p.total);
    });
    const chartData = Array.from(hariMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ totalPenjualan, totalTransaksi, totalLaba, produkTerlaris, chartData, penjualan });

  } else if (type === "pengeluaran") {
    const pengeluaran = await prisma.pengeluaran.findMany({
      where: { tanggal: { gte: start, lte: end } },
      orderBy: { tanggal: "desc" },
    });
    const totalPengeluaran = pengeluaran.reduce((sum, p) => sum + p.jumlah, 0);

    const kategoriMap = new Map<string, number>();
    pengeluaran.forEach((p) => {
      kategoriMap.set(p.kategori, (kategoriMap.get(p.kategori) || 0) + p.jumlah);
    });
    const pengeluaranPerKategori = Array.from(kategoriMap.entries()).map(
      ([kategori, jumlah]) => ({ kategori, jumlah })
    );

    return NextResponse.json({ totalPengeluaran, pengeluaranPerKategori, pengeluaran });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type") || "penjualan";

    // Default ke bulan ini kalau tidak ada parameter
    if (!startDate || !endDate) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return handleLaporan(type, start, end);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return handleLaporan(type, start, end);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
