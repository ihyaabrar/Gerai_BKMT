"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { Users, Building, Download, Printer, TrendingUp, PieChart } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface DistribusiData {
  totalLaba: number;
  bagianNasabah: number;
  bagianPengelola: number;
  persenNasabah: number;
  persenPengelola: number;
  distribusiNasabah: Array<{
    id: string;
    nama: string;
    jumlahInvestasi: number;
    bagian: number;
  }>;
  totalInvestasi: number;
}

export default function DistribusiPage() {
  const [data, setData] = useState<DistribusiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistribusiData();
  }, []);

  const fetchDistribusiData = async () => {
    try {
      setLoading(true);

      // Ambil pengaturan untuk persentase yang benar
      const [laporanRes, nasabahRes, pengaturanRes] = await Promise.all([
        fetch(`/api/laporan?type=penjualan&startDate=${
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        }&endDate=${new Date().toISOString()}`),
        fetch("/api/nasabah"),
        fetch("/api/pengaturan"),
      ]);

      const [laporanData, nasabahList, pengaturan] = await Promise.all([
        laporanRes.json(),
        nasabahRes.json(),
        pengaturanRes.json(),
      ]);

      const totalLaba = laporanData.totalLaba || 0;
      const persenNasabah = pengaturan.persenNasabah ?? 30;
      const persenPengelola = pengaturan.persenPengelola ?? 70;
      const bagianNasabah = totalLaba * (persenNasabah / 100);
      const bagianPengelola = totalLaba * (persenPengelola / 100);

      const activeNasabah = Array.isArray(nasabahList) ? nasabahList.filter((n: any) => n.aktif) : [];
      const totalInvestasi = activeNasabah.reduce((sum: number, n: any) => sum + n.jumlahInvestasi, 0);

      const distribusiNasabah = activeNasabah.map((n: any) => ({
        id: n.id,
        nama: n.nama,
        jumlahInvestasi: n.jumlahInvestasi,
        bagian: totalInvestasi > 0 ? (n.jumlahInvestasi / totalInvestasi) * bagianNasabah : 0,
      }));

      setData({
        totalLaba,
        bagianNasabah,
        bagianPengelola,
        persenNasabah,
        persenPengelola,
        distribusiNasabah,
        totalInvestasi,
      });
    } catch (error) {
      console.error("Failed to fetch distribusi data:", error);
      toast.error("Gagal memuat data distribusi");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    try {
      // Sheet 1: Ringkasan
      const ringkasan = [
        {
          "Keterangan": "Total Laba Bulan Ini",
          "Jumlah": data.totalLaba,
        },
        {
          "Keterangan": `Bagian Nasabah (${data.persenNasabah}%)`,
          "Jumlah": data.bagianNasabah,
        },
        {
          "Keterangan": `Bagian Pengelola (${data.persenPengelola}%)`,
          "Jumlah": data.bagianPengelola,
        },
      ];

      // Sheet 2: Distribusi Nasabah
      const distribusiNasabah = data.distribusiNasabah.map((n) => ({
        "Nama Nasabah": n.nama,
        "Investasi": n.jumlahInvestasi,
        "Persentase": data.totalInvestasi > 0 
          ? `${((n.jumlahInvestasi / data.totalInvestasi) * 100).toFixed(2)}%` 
          : "0%",
        "Bagi Hasil": n.bagian,
      }));

      // Sheet 3: Alokasi Pengelola
      const alokasi = [
        {
          "Kategori": "Gaji Pegawai",
          "Persentase": "20%",
          "Jumlah": data.bagianPengelola * 0.2,
        },
        {
          "Kategori": "Kontribusi Pemilik/Organisasi",
          "Persentase": "20%",
          "Jumlah": data.bagianPengelola * 0.2,
        },
        {
          "Kategori": "Dana Sosial",
          "Persentase": "20%",
          "Jumlah": data.bagianPengelola * 0.2,
        },
        {
          "Kategori": "Dana Pengembangan",
          "Persentase": "10%",
          "Jumlah": data.bagianPengelola * 0.1,
        },
        {
          "Kategori": "Operasional & Lainnya",
          "Persentase": "30%",
          "Jumlah": data.bagianPengelola * 0.3,
        },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ringkasan), "Ringkasan");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(distribusiNasabah), "Distribusi Nasabah");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alokasi), "Alokasi Pengelola");

      XLSX.writeFile(wb, `Distribusi_Laba_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Data berhasil diekspor ke Excel");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Gagal mengekspor data");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Gagal memuat data</p>
      </div>
    );
  }

  const rataRataBagiHasil = data.distribusiNasabah.length > 0
    ? data.bagianNasabah / data.distribusiNasabah.length
    : 0;

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-after: always; }
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold">Distribusi Laba</h1>
            <p className="text-gray-500">Sistem bagi hasil otomatis</p>
          </div>

          <div className="flex gap-2 no-print">
            <Button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 transition-all"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 transition-all"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Total Laba Card */}
        <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white overflow-hidden relative animate-fadeIn hover-lift transition-all-smooth">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Total Laba Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-bold mb-2">{formatRupiah(data.totalLaba)}</div>
            <p className="text-white/80 text-sm">Periode: {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
          </CardContent>
        </Card>

        {/* Distribusi Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover-lift transition-all-smooth animate-slideInLeft overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-lg">Bagian Nasabah ({data.persenNasabah}%)</CardTitle>
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {formatRupiah(data.bagianNasabah)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                <div
                  className="bg-gradient-to-r from-violet-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${data.persenNasabah}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift transition-all-smooth animate-slideInRight overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-lg">Bagian Pengelola ({data.persenPengelola}%)</CardTitle>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                {formatRupiah(data.bagianPengelola)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${data.persenPengelola}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualisasi & Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover-lift transition-all-smooth animate-fadeIn">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Visualisasi Distribusi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Nasabah</span>
                    <span className="font-bold text-violet-600">{data.persenNasabah}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-purple-600 h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-medium transition-all duration-1000"
                      style={{ width: `${data.persenNasabah}%` }}
                    >
                      {formatRupiah(data.bagianNasabah)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Pengelola</span>
                    <span className="font-bold text-emerald-600">{data.persenPengelola}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-medium transition-all duration-1000"
                      style={{ width: `${data.persenPengelola}%` }}
                    >
                      {formatRupiah(data.bagianPengelola)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift transition-all-smooth animate-fadeIn">
            <CardHeader>
              <CardTitle>Statistik Nasabah</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-violet-50 rounded-lg border border-violet-200">
                  <span className="text-gray-700">Total Nasabah Aktif</span>
                  <span className="text-2xl font-bold text-violet-600">
                    {data.distribusiNasabah.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-gray-700">Total Investasi</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatRupiah(data.totalInvestasi)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-gray-700">Rata-rata Bagi Hasil</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatRupiah(rataRataBagiHasil)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribusi Per Nasabah */}
        <Card className="animate-fadeIn print-break">
          <CardHeader>
            <CardTitle>Distribusi Per Nasabah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.distribusiNasabah.map((n, index) => {
                const persenInvestasi =
                  data.totalInvestasi > 0
                    ? (n.jumlahInvestasi / data.totalInvestasi) * 100
                    : 0;

                return (
                  <div
                    key={n.id}
                    className="border rounded-lg p-4 hover-lift transition-all-smooth bg-gradient-to-r from-white to-violet-50/30"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{n.nama}</h3>
                        <p className="text-sm text-gray-500">
                          Investasi: {formatRupiah(n.jumlahInvestasi)} ({persenInvestasi.toFixed(1)}%)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Bagi Hasil</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                          {formatRupiah(n.bagian)}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${persenInvestasi}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {data.distribusiNasabah.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Belum ada data nasabah aktif</p>
                <p className="text-gray-400 text-sm mt-2">Tambahkan nasabah di menu Master Data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alokasi Dana Pengelola */}
        <Card className="animate-fadeIn">
          <CardHeader>
            <CardTitle>Alokasi Dana Pengelola ({data.persenPengelola}%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border-2 border-emerald-200 hover-lift transition-all-smooth">
                <div>
                  <span className="font-semibold text-emerald-900">Gaji Pegawai</span>
                  <p className="text-sm text-emerald-600">20% dari bagian pengelola</p>
                </div>
                <span className="text-2xl font-bold text-emerald-700">
                  {formatRupiah(data.bagianPengelola * 0.2)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 hover-lift transition-all-smooth">
                <div>
                  <span className="font-semibold text-blue-900">Kontribusi Pemilik/Organisasi</span>
                  <p className="text-sm text-blue-600">20% dari bagian pengelola</p>
                </div>
                <span className="text-2xl font-bold text-blue-700">
                  {formatRupiah(data.bagianPengelola * 0.2)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border-2 border-amber-200 hover-lift transition-all-smooth">
                <div>
                  <span className="font-semibold text-amber-900">Dana Sosial</span>
                  <p className="text-sm text-amber-600">20% dari bagian pengelola</p>
                </div>
                <span className="text-2xl font-bold text-amber-700">
                  {formatRupiah(data.bagianPengelola * 0.2)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200 hover-lift transition-all-smooth">
                <div>
                  <span className="font-semibold text-purple-900">Dana Pengembangan</span>
                  <p className="text-sm text-purple-600">10% dari bagian pengelola</p>
                </div>
                <span className="text-2xl font-bold text-purple-700">
                  {formatRupiah(data.bagianPengelola * 0.1)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 hover-lift transition-all-smooth">
                <div>
                  <span className="font-semibold text-gray-900">Operasional & Lainnya</span>
                  <p className="text-sm text-gray-600">30% dari bagian pengelola</p>
                </div>
                <span className="text-2xl font-bold text-gray-700">
                  {formatRupiah(data.bagianPengelola * 0.3)}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">📋 Rincian Pembagian:</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  <span>20% untuk gaji pegawai/karyawan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>20% untuk kontribusi pemilik/organisasi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>20% untuk dana sosial dan kegiatan kemasyarakatan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>10% untuk dana pengembangan usaha</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600">•</span>
                  <span>30% untuk operasional dan kebutuhan lainnya</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
