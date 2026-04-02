import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  Award,
  BarChart3,
} from "lucide-react";
import { SalesChart } from "@/components/SalesChart";

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Penjualan hari ini
  const penjualanHariIni = await prisma.penjualan.aggregate({
    where: { tanggal: { gte: today } },
    _sum: { total: true },
  });

  // Laba bulan ini
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const penjualanBulanIni = await prisma.penjualan.findMany({
    where: { tanggal: { gte: firstDayOfMonth } },
    include: { detail: { include: { barang: true } } },
  });
  let labaBulanIni = 0;
  penjualanBulanIni.forEach((p) =>
    p.detail.forEach((d) => { labaBulanIni += (d.hargaJual - d.barang.hargaBeli) * d.qty; })
  );

  // Stats
  const totalBarang = await prisma.barang.count({ where: { aktif: true } });
  const stokRendah = await prisma.barang.count({
    where: { stok: { lte: prisma.barang.fields.stokMinimum }, aktif: true },
  });

  // Transaksi terbaru
  const transaksiTerbaru = await prisma.penjualan.findMany({
    take: 5,
    orderBy: { tanggal: "desc" },
    include: { member: true },
  });

  // Produk terlaris
  const produkTerlaris = await prisma.detailPenjualan.groupBy({
    by: ["barangId"],
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 5,
  });
  const barangTerlaris = await prisma.barang.findMany({
    where: { id: { in: produkTerlaris.map((p) => p.barangId) } },
  });

  // Grafik penjualan 12 bulan terakhir
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

    chartData.push({
      bulan: bulanNames[d.getMonth()],
      penjualan: totalPenjualan,
      laba: totalLaba,
    });
  }

  return {
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
  };
}

export default async function Dashboard() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Ringkasan aktivitas toko hari ini</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Penjualan Hari Ini", value: formatRupiah(data.penjualanHariIni), sub: "Hari ini", gradient: "from-emerald-500 to-teal-600", icon: DollarSign },
          { title: "Laba Bulan Ini", value: formatRupiah(data.labaBulanIni), sub: "Bulan ini", gradient: "from-blue-500 to-indigo-600", icon: TrendingUp },
          { title: "Total Barang", value: data.totalBarang, sub: "Produk aktif", gradient: "from-violet-500 to-purple-600", icon: Package },
          { title: "Stok Rendah", value: data.stokRendah, sub: "Perlu restock", gradient: "from-amber-500 to-orange-600", icon: AlertTriangle, warn: true },
        ].map((card) => (
          <Card key={card.title} className="relative overflow-hidden hover-lift border-0 shadow-md">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full -mr-12 -mt-12`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-500">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient}`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className={`text-2xl font-bold ${(card as any).warn ? "text-amber-600" : "text-gray-900"}`}>
                {card.value}
              </div>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grafik Penjualan */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Grafik Penjualan & Laba — 12 Bulan Terakhir
          </CardTitle>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              Penjualan
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-indigo-500" />
              Laba
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SalesChart data={data.chartData} />
        </CardContent>
      </Card>

      {/* Transaksi Terbaru + Produk Terlaris */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaksi Terbaru */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Clock className="h-4 w-4 text-white" />
              </div>
              Transaksi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.transaksiTerbaru.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.transaksiTerbaru.map((t, idx) => (
                  <div key={t.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{t.nomorTransaksi}</p>
                        <p className="text-xs text-gray-400">
                          {t.member?.nama || "Umum"} · {new Date(t.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 text-sm">{formatRupiah(t.total)}</p>
                      <Badge variant="outline" className="text-xs mt-0.5">{t.metodeBayar}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produk Terlaris */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Award className="h-4 w-4 text-white" />
              </div>
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.produkTerlaris.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Award className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.produkTerlaris.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{p.nama}</p>
                      <p className="text-xs text-gray-400">{formatRupiah(p.hargaJual)}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs shrink-0">
                      {p.totalTerjual} terjual
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
