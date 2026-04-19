"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import {
  DollarSign, TrendingUp, Package, AlertTriangle, Clock, Award, BarChart3,
} from "lucide-react";
import { SalesChart } from "@/components/SalesChart";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Memuat dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Ringkasan aktivitas toko hari ini</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Penjualan Hari Ini", value: formatRupiah(data.penjualanHariIni), sub: "Hari ini", gradient: "from-emerald-500 to-teal-600", icon: DollarSign },
          { title: "Laba Bulan Ini", value: formatRupiah(data.labaKotor ?? data.labaBulanIni ?? 0), sub: `Bersih: ${formatRupiah(data.labaBersih ?? 0)}`, gradient: "from-blue-500 to-indigo-600", icon: TrendingUp },
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
              <div className="w-3 h-3 rounded-sm bg-emerald-500" /> Penjualan
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-indigo-500" /> Laba
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SalesChart data={data.chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {data.transaksiTerbaru.map((t: any, idx: number) => (
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
                {data.produkTerlaris.map((p: any, idx: number) => (
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
