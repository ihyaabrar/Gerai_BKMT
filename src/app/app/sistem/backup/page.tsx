"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, Download, ShieldCheck, Loader2 } from "lucide-react";
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
  distribusi: number;
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
  distribusi: "Distribusi Laba",
};

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Pilihan periode: 24 bulan terakhir, ditambah opsi seluruh data. */
function daftarPeriode() {
  const sekarang = new Date();
  const bulan = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1);
    return {
      nilai: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`,
    };
  });
  return [{ nilai: "", label: "Seluruh data" }, ...bulan];
}

export default function EksporPage() {
  const periodeOpsi = useMemo(daftarPeriode, []);
  // Bulan berjalan jadi pilihan awal: inilah yang biasanya benar-benar
  // dibutuhkan pengurus, dan ukurannya tidak pernah mendekati batas.
  const [periode, setPeriode] = useState(periodeOpsi[1].nilai);

  const [statistik, setStatistik] = useState<Statistik | null>(null);
  const [loading, setLoading] = useState(true);
  const [mengunduh, setMengunduh] = useState(false);

  useEffect(() => {
    fetch("/api/backup", { method: "POST" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setStatistik(data.statistik))
      .catch(() => toast.error("Gagal memuat statistik database"))
      .finally(() => setLoading(false));
  }, []);

  const unduh = async () => {
    setMengunduh(true);
    try {
      const res = await fetch(`/api/backup${periode ? `?periode=${periode}` : ""}`);

      if (!res.ok) {
        // Pesan dari server menjelaskan apa yang harus dilakukan — mis. data
        // terlalu besar, ekspor per bulan saja. Menggantinya dengan "gagal"
        // generik justru menghilangkan satu-satunya petunjuk yang ada.
        const pesan = await res
          .json()
          .then((d) => d?.error)
          .catch(() => null);
        toast.error(pesan || "Gagal mengekspor data");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename =
        disposition.match(/filename="?([^"]+)"?/)?.[1] ?? "gerai-bkmt.json";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`${filename} diunduh`);
    } catch {
      toast.error("File belum terunduh", { description: "Periksa sambungan internet, lalu coba lagi." });
    } finally {
      setMengunduh(false);
    }
  };

  const labelPeriode =
    periodeOpsi.find((p) => p.nilai === periode)?.label ?? "Seluruh data";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Unduh Data (Excel)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Salinan data dalam format JSON untuk arsip dan pemeriksaan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            aria-label="Pilih periode ekspor"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="h-9 w-auto min-w-[11rem] text-sm"
          >
            {periodeOpsi.map((p) => (
              <option key={p.nilai || "semua"} value={p.nilai}>
                {p.label}
              </option>
            ))}
          </Select>
          <Button onClick={unduh} disabled={mengunduh}>
            {mengunduh ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyiapkan...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Unduh
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Yang sebenarnya melindungi data */}
      <Card>
        <CardContent className="flex items-start gap-3.5">
          <span className="shrink-0 h-11 w-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-slate-900">
              Seberapa jauh data bisa dipulihkan
            </p>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-3xl">
              Database Neon paket gratis hanya bisa dipulihkan{" "}
              <strong>6 jam ke belakang</strong>. Kesalahan yang baru ketahuan
              keesokan harinya tidak bisa dipulihkan dari sana.
              <br />
              <br />
              Selama masih paket gratis, berkas dari halaman ini adalah satu-satunya
              salinan yang lebih tua. Unduh <strong>setiap minggu</strong> dan simpan
              di luar komputer kasir. Password pengguna sengaja tidak disertakan.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5">
            <CardIcon icon={Database} nada="brand" />
            Isi Database
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-card" />
              ))}
            </div>
          ) : !statistik ? (
            <p className="text-center py-8 text-slate-400 text-sm">
              Statistik tidak tersedia
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {(Object.keys(LABEL) as (keyof Statistik)[]).map((key) => (
                  <div
                    key={key}
                    className="rounded-card border border-border p-4 bg-white"
                  >
                    <p className="text-xs text-slate-500">{LABEL[key]}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                      {(statistik[key] ?? 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Ekspor <strong>{labelPeriode}</strong> memuat data induk lengkap
                (barang, member, nasabah, pengaturan) ditambah transaksi pada
                periode itu. Rekaman distribusi bagi hasil ikut disertakan —
                itulah yang menjawab pertanyaan anggota tentang pembagian
                bulan-bulan sebelumnya.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
