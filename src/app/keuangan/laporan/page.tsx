"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, ShoppingCart, DollarSign, Download, FileText, Loader2, Calendar } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface LaporanData {
  totalPenjualan: number;
  totalTransaksi: number;
  totalLaba: number;
  produkTerlaris: Array<{
    id: string;
    nama: string;
    qty: number;
    total: number;
  }>;
  chartData: Array<{
    date: string;
    total: number;
  }>;
}

export default function LaporanPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LaporanData | null>(null);
  const [form, setForm] = useState({
    startDate: format(new Date(), "yyyy-MM-01"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/laporan?type=penjualan&startDate=${form.startDate}&endDate=${form.endDate}`
      );
      const result = await res.json();
      setData(result);
      toast.success("Laporan berhasil di-generate!");
    } catch (error) {
      toast.error("Gagal generate laporan");
      console.error("Failed to generate report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!data) return;

    try {
      // Sheet 1: Summary
      const summaryData = [
        { Label: "Total Penjualan", Value: data.totalPenjualan },
        { Label: "Total Laba", Value: data.totalLaba },
        { Label: "Total Transaksi", Value: data.totalTransaksi },
        {
          Label: "Rata-rata Transaksi",
          Value: data.totalTransaksi > 0 ? Math.round(data.totalPenjualan / data.totalTransaksi) : 0,
        },
        {
          Label: "Margin Laba (%)",
          Value: data.totalPenjualan > 0 ? ((data.totalLaba / data.totalPenjualan) * 100).toFixed(2) : 0,
        },
      ];

      // Sheet 2: Produk Terlaris
      const produkData = data.produkTerlaris.map((p, idx) => ({
        Ranking: idx + 1,
        Produk: p.nama,
        "Qty Terjual": p.qty,
        "Total Penjualan": p.total,
      }));

      // Sheet 3: Penjualan Harian
      const chartData = data.chartData.map((item) => ({
        Tanggal: format(new Date(item.date), "dd/MM/yyyy"),
        "Total Penjualan": item.total,
      }));

      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      ws1["!cols"] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan");

      const ws2 = XLSX.utils.json_to_sheet(produkData);
      ws2["!cols"] = [{ wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Produk Terlaris");

      const ws3 = XLSX.utils.json_to_sheet(chartData);
      ws3["!cols"] = [{ wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws3, "Penjualan Harian");

      XLSX.writeFile(
        wb,
        `Laporan_Penjualan_${form.startDate}_${form.endDate}.xlsx`
      );
      
      toast.success("Laporan berhasil di-export ke Excel!");
    } catch (error) {
      toast.error("Gagal export Excel");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="animate-slideInRight">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Laporan Penjualan
        </h1>
        <p className="text-gray-600 mt-2">Ringkasan dan statistik penjualan periode tertentu</p>
      </div>

      <Card className="border-0 shadow-lg animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700">Tanggal Akhir</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Laporan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="flex justify-end gap-2 print:hidden animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <Button 
              onClick={handleExportExcel} 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={handlePrint} variant="outline" className="hover-lift">
              <FileText className="h-4 w-4 mr-2" />
              Print / PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="relative overflow-hidden hover-lift animate-fadeIn border-0 shadow-lg" style={{ animationDelay: '0.3s' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-600">Total Penjualan</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-900">
                  {formatRupiah(data.totalPenjualan)}
                </div>
                <p className="text-sm text-emerald-600 mt-2 font-medium">
                  {data.totalTransaksi} transaksi
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover-lift animate-fadeIn border-0 shadow-lg" style={{ animationDelay: '0.4s' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-600">Total Laba</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-900">
                  {formatRupiah(data.totalLaba)}
                </div>
                <p className="text-sm text-blue-600 mt-2 font-medium">
                  Margin:{" "}
                  {data.totalPenjualan > 0
                    ? ((data.totalLaba / data.totalPenjualan) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover-lift animate-fadeIn border-0 shadow-lg" style={{ animationDelay: '0.5s' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500 to-purple-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-600">Rata-rata Transaksi</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-900">
                  {formatRupiah(
                    data.totalTransaksi > 0 ? data.totalPenjualan / data.totalTransaksi : 0
                  )}
                </div>
                <p className="text-sm text-violet-600 mt-2 font-medium">Per transaksi</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                Grafik Penjualan Harian
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.chartData.length > 0 ? (
                <div className="space-y-3">
                  {data.chartData.map((item, idx) => {
                    const maxValue = Math.max(...data.chartData.map((d) => d.total));
                    const percentage = maxValue > 0 ? (item.total / maxValue) * 100 : 0;

                    return (
                      <div 
                        key={item.date} 
                        className="flex items-center gap-4 animate-slideInRight"
                        style={{ animationDelay: `${0.7 + idx * 0.05}s` }}
                      >
                        <div className="w-24 text-sm font-medium text-gray-700">
                          {format(new Date(item.date), "dd MMM")}
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-100 rounded-full h-10 relative overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-10 rounded-full flex items-center justify-end pr-4 transition-all-smooth"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            >
                              {percentage > 20 && (
                                <span className="text-white text-sm font-semibold">
                                  {formatRupiah(item.total)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {percentage <= 20 && (
                          <div className="w-32 text-sm font-semibold text-gray-700">
                            {formatRupiah(item.total)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada data penjualan pada periode ini</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg animate-fadeIn" style={{ animationDelay: '0.8s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Produk Terlaris
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.produkTerlaris.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Ranking</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Produk</th>
                        <th className="text-right p-4 text-sm font-semibold text-gray-700">Qty Terjual</th>
                        <th className="text-right p-4 text-sm font-semibold text-gray-700">Total Penjualan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.produkTerlaris.map((p, index) => (
                        <tr 
                          key={p.id} 
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all-smooth animate-fadeIn"
                          style={{ animationDelay: `${0.9 + index * 0.1}s` }}
                        >
                          <td className="p-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-md">
                              {index + 1}
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-gray-900">{p.nama}</p>
                          </td>
                          <td className="p-4 text-right">
                            <Badge variant="outline" className="font-semibold">
                              {p.qty} unit
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <p className="font-bold text-emerald-600 text-lg">
                              {formatRupiah(p.total)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada data produk pada periode ini</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!data && !loading && (
        <Card className="border-0 shadow-lg animate-scaleIn" style={{ animationDelay: '0.2s' }}>
          <CardContent className="py-16">
            <div className="text-center text-gray-500">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center animate-bounce-soft">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">Belum Ada Laporan</p>
              <p className="text-gray-500">Pilih periode dan klik "Generate Laporan" untuk melihat data</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
