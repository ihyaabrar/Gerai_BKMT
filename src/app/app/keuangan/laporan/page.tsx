"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, TrendingUp, ShoppingCart, Coins, Download, Printer, Loader2, Calendar, Award } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface LaporanData {
  totalPenjualan: number;
  totalTransaksi: number;
  totalLaba: number;
  kerugianStok?: number;
  labaDibagi?: number;
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
      const result = await res.json().catch(() => null);
      if (!res.ok || !result) {
        // Tanpa ini, respons galat disimpan sebagai laporan dan halaman
        // menampilkan "Rp NaN" atau berhenti karena data yang tidak lengkap.
        toast.error(result?.error || "Laporan gagal dibuat");
        return;
      }
      setData(result);
      toast.success("Laporan siap");
    } catch (error) {
      toast.error("Laporan gagal dibuat");
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
        { Label: "Kerugian Stok (barang rusak/hilang)", Value: data.kerugianStok ?? 0 },
        { Label: "Laba Dibagi", Value: data.labaDibagi ?? data.totalLaba },
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
      
      toast.success("Laporan diunduh sebagai file Excel");
    } catch (error) {
      toast.error("File Excel gagal dibuat");
    }
  };

  const maks = data ? Math.max(1, ...data.chartData.map((d) => d.total)) : 1;
  const labaKotor = data ? data.labaDibagi ?? data.totalLaba : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        judul="Laporan Penjualan"
        deskripsi="Penjualan per hari dan barang paling laku untuk periode yang dipilih."
        aksi={
          data && (
            <div className="flex gap-2 print:hidden">
              <Button onClick={handleExportExcel} variant="outline">
                <Download className="h-4 w-4" /> Unduh Excel
              </Button>
              <Button onClick={handlePrint} variant="outline">
                <Printer className="h-4 w-4" /> Cetak / PDF
              </Button>
            </div>
          )
        }
      />

      <Card className="print:hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5">
            <CardIcon icon={Calendar} nada="sky" />
            Pilih Periode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-slate-700" htmlFor="tanggal-mulai">Dari tanggal</label>
              <Input id="tanggal-mulai"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-slate-700" htmlFor="tanggal-akhir">Sampai tanggal</label>
              <Input id="tanggal-akhir"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
              ) : (
                <><BarChart3 className="h-4 w-4" /> Tampilkan Laporan</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Penjualan"
              nilai={formatRupiah(data.totalPenjualan)}
              icon={TrendingUp}
              nada="brand"
              catatan={`${data.totalTransaksi} transaksi`}
            />
            <StatCard
              label="Laba Kotor"
              nilai={formatRupiah(labaKotor)}
              icon={Coins}
              nada="gold"
              negatif={labaKotor < 0}
              catatan={
                (data.kerugianStok ?? 0) > 0
                  ? `Sudah dikurangi barang rusak/hilang ${formatRupiah(data.kerugianStok ?? 0)}`
                  : `${data.totalPenjualan > 0 ? ((labaKotor / data.totalPenjualan) * 100).toFixed(1) : 0}% dari penjualan`
              }
            />
            <StatCard
              label="Rata-rata per Transaksi"
              nilai={formatRupiah(data.totalTransaksi > 0 ? Math.round(data.totalPenjualan / data.totalTransaksi) : 0)}
              icon={ShoppingCart}
              nada="violet"
            />
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5">
                <CardIcon icon={BarChart3} nada="brand" />
                Penjualan per Hari
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.chartData.length > 0 ? (
                <ul className="space-y-2.5">
                  {data.chartData.map((item) => (
                    <li key={item.date} className="grid grid-cols-[4.5rem_1fr_auto] sm:grid-cols-[6rem_1fr_8rem] items-center gap-3">
                      <span className="text-sm text-slate-600">{format(new Date(item.date), "dd MMM")}</span>
                      <span className="h-3 rounded-full bg-surface-sunken overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-brand-500"
                          style={{ width: `${Math.max(2, (item.total / maks) * 100)}%` }}
                        />
                      </span>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums text-right">
                        {formatRupiah(item.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <BarChart3 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Tidak ada penjualan pada periode ini</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5">
                <CardIcon icon={Award} nada="gold" />
                Barang Paling Laku
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.produkTerlaris.length > 0 ? (
                <ol className="divide-y divide-border">
                  {data.produkTerlaris.map((p, index) => (
                    <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="shrink-0 h-8 w-8 rounded-lg bg-brand-50 text-brand-700 text-sm font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-slate-900 break-words">{p.nama}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.qty} terjual</p>
                      </div>
                      <span className="font-bold text-sm text-brand-700 tabular-nums shrink-0">
                        {formatRupiah(p.total)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Award className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Tidak ada barang terjual pada periode ini</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!data && !loading && (
        <Card>
          <CardContent className="py-14 text-center">
            <span className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <BarChart3 className="h-7 w-7" />
            </span>
            <p className="font-semibold text-slate-900">Belum ada laporan</p>
            <p className="text-sm text-slate-500 mt-1">Pilih periode lalu tekan &quot;Tampilkan Laporan&quot;.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
