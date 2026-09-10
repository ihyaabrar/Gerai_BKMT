"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Download, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Statistik {
  barang: number;
  member: number;
  nasabah: number;
  supplier: number;
  penjualan: number;
  pengeluaran: number;
  retur: number;
  shift: number;
}

const LABEL: Record<keyof Statistik, string> = {
  barang: "Barang",
  member: "Member",
  nasabah: "Nasabah",
  supplier: "Supplier",
  penjualan: "Transaksi Penjualan",
  pengeluaran: "Pengeluaran",
  retur: "Retur",
  shift: "Shift Kasir",
};

export default function BackupPage() {
  const [statistik, setStatistik] = useState<Statistik | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchStatistik = async () => {
      try {
        const res = await fetch("/api/backup", { method: "POST" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStatistik(data.statistik);
      } catch {
        toast.error("Gagal memuat statistik database");
      } finally {
        setLoading(false);
      }
    };
    fetchStatistik();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename =
        disposition.match(/filename="?([^"]+)"?/)?.[1] ?? "backup-gerai-bkmt.json";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("Backup berhasil diunduh");
    } catch {
      toast.error("Gagal membuat backup");
    } finally {
      setDownloading(false);
    }
  };

  const totalBaris = statistik
    ? Object.values(statistik).reduce((sum, n) => sum + n, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Backup Data</h1>
          <p className="text-slate-500">Unduh salinan seluruh data dalam format JSON</p>
        </div>
        <Button
          onClick={handleDownload}
          disabled={downloading || loading}
        >
          {downloading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyiapkan...</>
          ) : (
            <><Download className="h-4 w-4 mr-2" /> Unduh Backup</>
          )}
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <CardHeader>
          <CardTitle className="text-white">Informasi Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-80">Jenis Database</p>
              <p className="text-lg font-semibold">PostgreSQL</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Total Baris Data</p>
              <p className="text-lg font-semibold">
                {loading ? "…" : totalBaris.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Isi Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : !statistik ? (
            <p className="text-center py-8 text-slate-400">Statistik tidak tersedia</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(LABEL) as (keyof Statistik)[]).map((key) => (
                <div key={key} className="p-4 border rounded-xl">
                  <p className="text-xs text-slate-500">{LABEL[key]}</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {statistik[key].toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-800 flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5" />
            Catatan Penting
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 space-y-1">
          <p>• Unduh backup secara berkala dan simpan di lokasi aman (cloud/external drive)</p>
          <p>• Password pengguna sengaja tidak disertakan dalam file backup</p>
          <p>• File JSON ini untuk arsip &amp; migrasi data, bukan snapshot penuh PostgreSQL</p>
          <p>• Untuk backup tingkat database, gunakan fitur snapshot dari penyedia (Neon/Supabase) atau <code className="bg-amber-100 px-1 rounded">pg_dump</code></p>
        </CardContent>
      </Card>
    </div>
  );
}
