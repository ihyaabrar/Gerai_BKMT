"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn, formatRupiah } from "@/lib/utils";
import { bagiRata } from "@/lib/keuangan";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth";
import {
  AlertTriangle,
  Building,
  Download,
  Lock,
  Unlock,
  Printer,
  TrendingDown,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

/**
 * Alokasi internal bagian pengelola. Angka ini kesepakatan pengurus dan
 * tidak diatur lewat halaman pengaturan, jadi ditulis apa adanya di sini.
 */
const ALOKASI_PENGELOLA = [
  { nama: "Gaji Pegawai", persen: 20 },
  { nama: "Kontribusi Pemilik/Organisasi", persen: 20 },
  { nama: "Dana Sosial", persen: 20 },
  { nama: "Dana Pengembangan", persen: 10 },
  { nama: "Operasional & Lainnya", persen: 30 },
];

interface BarisNasabah {
  nasabahId?: string;
  id?: string;
  namaNasabah: string;
  jumlahInvestasi: number;
  persentase: number;
  bagian: number;
}

interface Distribusi {
  periode: string;
  totalPenjualan: number;
  totalHpp: number;
  totalDiskon: number;
  labaKotor: number;
  totalTransaksi?: number;
  persenNasabah: number;
  persenPengelola: number;
  bagianNasabah: number;
  bagianPengelola: number;
  totalInvestasi: number;
  rugi?: boolean;
  rosterDariArsip?: boolean;
  catatan?: string | null;
  createdAt?: string;
  dibuatOleh?: { nama: string } | null;
  detail: BarisNasabah[];
}

interface RiwayatBuka {
  id: string;
  alasan: string;
  dibukaPada: string;
  dibukaOleh: { nama: string } | null;
}

interface Respons {
  status: "ditutup" | "pratinjau";
  label: string;
  bisaDitutup?: boolean;
  distribusi: Distribusi;
  riwayatBuka?: RiwayatBuka[];
}

/**
 * Alokasi bagian pengelola dibagi dengan largest-remainder, sama seperti
 * bagian nasabah. Pembulatan per baris membuat jumlah kelima pos meleset
 * Rp1–2 dari bagian pengelola — selisih kecil yang pasti ditanyakan bendahara.
 * Pada bulan rugi tidak ada yang dialokasikan.
 */
function hitungAlokasi(bagianPengelola: number): number[] {
  if (bagianPengelola <= 0) return ALOKASI_PENGELOLA.map(() => 0);
  return bagiRata(bagianPengelola, ALOKASI_PENGELOLA.map((a) => a.persen));
}

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** 24 bulan terakhir, terbaru lebih dulu. */
function daftarPeriode(): { nilai: string; label: string }[] {
  const sekarang = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1);
    const nilai = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { nilai, label: `${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}` };
  });
}

export default function DistribusiPage() {
  const { user } = useAuthStore();
  const isMaster = user?.role === "master";
  const { konfirmasi, dialog } = useConfirm();

  const periodeOpsi = useMemo(daftarPeriode, []);
  // Bulan lalu jadi pilihan awal: bulan berjalan tidak mungkin ditutup, dan
  // yang biasanya perlu diurus di awal bulan adalah pembagian bulan lalu.
  const [periode, setPeriode] = useState(periodeOpsi[1].nilai);
  const permintaanTerakhir = useRef(0);
  const [bukaDialog, setBukaDialog] = useState(false);
  const [alasanBuka, setAlasanBuka] = useState("");
  const [membuka, setMembuka] = useState(false);
  const [data, setData] = useState<Respons | null>(null);
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [ditutup, setDitutup] = useState<Set<string>>(new Set());

  const ambilDaftar = useCallback(async () => {
    const res = await fetch("/api/distribusi?daftar=1");
    if (!res.ok) return;
    const json = await res.json();
    setDitutup(new Set((json.daftar ?? []).map((d: { periode: string }) => d.periode)));
  }, []);

  const ambil = useCallback(async (p: string) => {
    // Pemilih periode bisa diganti cepat sementara database masih bangun.
    // Hanya jawaban untuk permintaan TERAKHIR yang boleh tampil — kalau tidak,
    // layar bisa menampilkan angka Agustus sementara pemilih menunjuk Juli,
    // dan tombol "Tutup" menutup bulan yang berbeda dari yang terlihat.
    const nomor = ++permintaanTerakhir.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/distribusi?periode=${p}`);
      const json = await res.json();
      if (nomor !== permintaanTerakhir.current) return;
      if (!res.ok) {
        toast.error(json?.error || "Gagal memuat distribusi");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      if (nomor !== permintaanTerakhir.current) return;
      toast.error("Gagal memuat distribusi");
      setData(null);
    } finally {
      if (nomor === permintaanTerakhir.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    ambilDaftar();
  }, [ambilDaftar]);

  useEffect(() => {
    ambil(periode);
  }, [periode, ambil]);

  const tutupPeriode = () => {
    if (!data) return;
    const d = data.distribusi;
    konfirmasi({
      judul: `Tutup distribusi ${data.label}?`,
      pesan: (
        <>
          Seluruh angka di halaman ini akan <strong>dibekukan</strong> sebagai
          rekaman resmi periode {data.label}: laba{" "}
          {formatRupiah(d.labaKotor)}, bagian nasabah{" "}
          {formatRupiah(d.bagianNasabah)} untuk {d.detail.length} orang.
          <br />
          <br />
          Setelah ditutup, angka ini tidak akan berubah walaupun harga barang
          atau daftar nasabah diubah kemudian. Inilah yang dipakai untuk
          menjawab pertanyaan anggota di kemudian hari.
        </>
      ),
      labelKonfirmasi: "Tutup & Simpan",
      nada: "normal",
      aksi: async () => {
        setMenyimpan(true);
        try {
          const res = await fetch("/api/distribusi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Periode diambil dari data yang sedang tampil, bukan dari
            // pemilih, supaya yang ditutup selalu yang dilihat di dialog.
            body: JSON.stringify({ periode: d.periode }),
          });
          const json = await res.json();
          if (!res.ok) {
            toast.error(json?.error || "Gagal menutup distribusi");
            return;
          }
          toast.success(`Distribusi ${data.label} tersimpan`);
          await Promise.all([ambilDaftar(), ambil(d.periode)]);
        } finally {
          setMenyimpan(false);
        }
      },
    });
  };

  const bukaKembali = async () => {
    if (!data || membuka) return;
    const target = data.distribusi.periode;
    setMembuka(true);
    try {
      const res = await fetch(
        `/api/distribusi?periode=${target}&alasan=${encodeURIComponent(alasanBuka.trim())}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.error || "Gagal membuka kembali periode");
        return;
      }
      toast.success("Periode dibuka kembali — rekaman lama tersimpan di arsip");
      setBukaDialog(false);
      setAlasanBuka("");
      await Promise.all([ambilDaftar(), ambil(target)]);
    } finally {
      setMembuka(false);
    }
  };

  const exportExcel = () => {
    if (!data) return;
    const d = data.distribusi;
    try {
      const ringkasan = [
        { Keterangan: "Periode", Nilai: data.label },
        { Keterangan: "Status", Nilai: data.status === "ditutup" ? "Ditutup" : "Pratinjau" },
        { Keterangan: "Total Penjualan", Nilai: d.totalPenjualan },
        { Keterangan: "Harga Pokok Penjualan", Nilai: d.totalHpp },
        { Keterangan: "Diskon Member", Nilai: d.totalDiskon },
        { Keterangan: "Laba Kotor", Nilai: d.labaKotor },
        { Keterangan: `Bagian Nasabah (${d.persenNasabah}%)`, Nilai: d.bagianNasabah },
        { Keterangan: `Bagian Pengelola (${d.persenPengelola}%)`, Nilai: d.bagianPengelola },
        { Keterangan: "Total Investasi", Nilai: d.totalInvestasi },
      ];

      const perNasabah = d.detail.map((n) => ({
        "Nama Nasabah": n.namaNasabah,
        Investasi: n.jumlahInvestasi,
        Persentase: `${n.persentase.toFixed(2)}%`,
        "Bagi Hasil": n.bagian,
      }));

      const nilaiAlokasi = hitungAlokasi(d.bagianPengelola);
      const alokasi = ALOKASI_PENGELOLA.map((a, i) => ({
        Kategori: a.nama,
        Persentase: `${a.persen}%`,
        Jumlah: nilaiAlokasi[i],
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ringkasan), "Ringkasan");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(perNasabah), "Bagi Hasil Nasabah");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alokasi), "Alokasi Pengelola");
      XLSX.writeFile(wb, `Distribusi_Laba_${d.periode}.xlsx`);
      toast.success("Data diekspor ke Excel");
    } catch {
      toast.error("Gagal mengekspor data");
    }
  };

  const d = data?.distribusi;
  const sudahDitutup = data?.status === "ditutup";

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-5">
        <div className="flex flex-wrap gap-3 items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Distribusi Laba
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Bagi hasil nasabah per periode, dibekukan saat periode ditutup.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 no-print">
            <Select
              aria-label="Pilih periode"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="h-9 w-auto min-w-[11rem] text-sm"
            >
              {periodeOpsi.map((p) => (
                <option key={p.nilai} value={p.nilai}>
                  {p.label}
                  {ditutup.has(p.nilai) ? " — ditutup" : ""}
                </option>
              ))}
            </Select>
            <Button variant="outline" size="sm" onClick={exportExcel} disabled={!d}>
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!d}>
              <Printer className="h-4 w-4" /> Cetak
            </Button>
          </div>
        </div>

        {loading || !d ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-card" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-card" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-card" />
          </div>
        ) : (
          <>
            {/* Status periode */}
            <Card>
              <CardContent className="p-5 pt-5 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <span
                    className={cn(
                      "shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center",
                      sudahDitutup
                        ? "bg-brand-50 text-brand-600"
                        : "bg-gold-50 text-gold-600"
                    )}
                  >
                    {sudahDitutup ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <Unlock className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900">{data.label}</p>
                      <Badge variant={sudahDitutup ? "default" : "secondary"}>
                        {sudahDitutup ? "Ditutup" : "Pratinjau"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-2xl">
                      {sudahDitutup ? (
                        <>
                          Angka periode ini sudah dibekukan
                          {d.dibuatOleh?.nama ? ` oleh ${d.dibuatOleh.nama}` : ""}
                          {d.createdAt
                            ? ` pada ${new Date(d.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}`
                            : ""}
                          . Mengubah harga barang atau daftar nasabah tidak
                          mengubah angka ini lagi.
                        </>
                      ) : (
                        <>
                          Angka ini <strong>dihitung ulang setiap dibuka</strong> dan
                          masih bisa berubah bila ada transaksi dibatalkan, atau
                          bila daftar nasabah maupun persentase bagi hasil
                          diubah. Karena itu perubahan nasabah dan persentase
                          dikunci sampai bulan lalu ditutup. Tutup periode untuk
                          membekukannya sebagai rekaman resmi.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 no-print shrink-0">
                  {sudahDitutup
                    ? isMaster && (
                        <Button variant="outline" size="sm" onClick={() => setBukaDialog(true)}>
                          Buka Kembali
                        </Button>
                      )
                    : data.bisaDitutup && (
                        <Button size="sm" onClick={tutupPeriode} disabled={menyimpan}>
                          {menyimpan ? "Menyimpan..." : "Tutup & Simpan"}
                        </Button>
                      )}
                </div>
              </CardContent>
            </Card>

            {!sudahDitutup && d.rosterDariArsip && (
              <div className="rounded-card border border-sky-200 bg-sky-50/60 px-4 py-3 flex gap-3">
                <AlertTriangle className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-sm text-sky-900 leading-relaxed">
                  Periode ini pernah ditutup lalu dibuka kembali. Daftar nasabah,
                  modal, dan persentasenya <strong>dipakai ulang dari rekaman
                  sebelumnya</strong> — hanya angka laba yang dihitung ulang.
                </p>
              </div>
            )}

            {(data.riwayatBuka?.length ?? 0) > 0 && (
              <Card>
                <CardContent className="p-5 pt-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Riwayat dibuka kembali
                  </p>
                  <ul className="mt-2 space-y-2">
                    {data.riwayatBuka!.map((r) => (
                      <li key={r.id} className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-medium text-slate-800">
                          {new Date(r.dibukaPada).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {r.dibukaOleh?.nama ? ` oleh ${r.dibukaOleh.nama}` : ""} — {r.alasan}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Isi lengkap rekaman sebelum dibuka tersimpan di arsip dan ikut
                    dalam ekspor data.
                  </p>
                </CardContent>
              </Card>
            )}

            {!sudahDitutup && data.bisaDitutup === false && (
              <div className="rounded-card border border-gold-200 bg-gold-50/60 px-4 py-3 flex gap-3">
                <AlertTriangle className="h-4 w-4 text-gold-600 shrink-0 mt-0.5" />
                <p className="text-sm text-gold-900 leading-relaxed">
                  Periode ini belum berakhir, jadi belum bisa ditutup. Transaksi
                  yang masuk sampai akhir bulan masih akan mengubah angkanya.
                </p>
              </div>
            )}

            {d.rugi && (
              <div className="rounded-card border border-rose-200 bg-rose-50/60 px-4 py-3 flex gap-3">
                <TrendingDown className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-900 leading-relaxed">
                  Periode ini <strong>tidak menghasilkan laba</strong>. Sesuai
                  kebijakan sistem, kerugian tidak dibebankan ke nasabah — bagian
                  mereka nol, tidak negatif. Bila pengurus memutuskan lain,
                  kebijakan ini harus diubah lebih dulu.
                </p>
              </div>
            )}

            {/* Ringkasan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "Laba Kotor",
                  nilai: d.labaKotor,
                  catatan: `${d.totalTransaksi ?? 0} transaksi`,
                  warna: "bg-gold-50 text-gold-600",
                  icon: Building,
                },
                {
                  label: `Bagian Nasabah (${d.persenNasabah}%)`,
                  nilai: d.bagianNasabah,
                  catatan: `${d.detail.length} nasabah · modal ${formatRupiah(d.totalInvestasi)}`,
                  warna: "bg-brand-50 text-brand-600",
                  icon: Users,
                },
                {
                  label: `Bagian Pengelola (${d.persenPengelola}%)`,
                  nilai: d.bagianPengelola,
                  catatan: "Dialokasikan menurut tabel di bawah",
                  warna: "bg-sky-50 text-sky-600",
                  icon: Building,
                },
              ].map((k) => (
                <Card key={k.label}>
                  <CardContent className="p-5 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-500">{k.label}</p>
                        <p
                          title={formatRupiah(k.nilai)}
                          className={cn(
                            "mt-1.5 text-xl sm:text-2xl font-extrabold truncate",
                            k.nilai < 0 ? "text-rose-600" : "text-brand-900"
                          )}
                        >
                          {formatRupiah(k.nilai)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">{k.catatan}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center",
                          k.warna
                        )}
                      >
                        <k.icon className="h-5 w-5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Asal-usul angka laba */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Dari Mana Angka Laba Ini</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <dl className="divide-y divide-border text-sm">
                  {[
                    ["Penjualan diterima", d.totalPenjualan, "Sudah dipotong diskon member"],
                    ["Harga pokok penjualan", -d.totalHpp, "Harga beli saat transaksi terjadi"],
                  ].map(([label, nilai, catatan]) => (
                    <div key={label as string} className="flex items-baseline justify-between gap-4 py-2.5">
                      <div className="min-w-0">
                        <dt className="text-slate-700">{label as string}</dt>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {catatan as string}
                        </p>
                      </div>
                      <dd
                        className={cn(
                          "font-semibold tabular-nums shrink-0",
                          (nilai as number) < 0 ? "text-rose-600" : "text-slate-900"
                        )}
                      >
                        {formatRupiah(nilai as number)}
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="font-bold text-slate-900">Laba kotor</dt>
                    <dd
                      className={cn(
                        "font-extrabold tabular-nums",
                        d.labaKotor < 0 ? "text-rose-600" : "text-brand-700"
                      )}
                    >
                      {formatRupiah(d.labaKotor)}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Diskon member sebesar {formatRupiah(d.totalDiskon)} sudah
                  terpotong dari penjualan di atas, jadi tidak dikurangkan lagi.
                </p>
              </CardContent>
            </Card>

            {/* Bagi hasil per nasabah */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Bagi Hasil Per Nasabah</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {d.detail.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Belum ada nasabah aktif pada periode ini</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-sm min-w-[34rem]">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-border">
                          <th className="py-2.5 font-medium">Nasabah</th>
                          <th className="py-2.5 font-medium text-right">Investasi</th>
                          <th className="py-2.5 font-medium text-right">Porsi</th>
                          <th className="py-2.5 font-medium text-right">Bagi Hasil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {d.detail.map((n) => (
                          <tr key={n.id ?? n.nasabahId}>
                            <td className="py-2.5 font-medium text-slate-900">
                              {n.namaNasabah}
                            </td>
                            <td className="py-2.5 text-right tabular-nums text-slate-600">
                              {formatRupiah(n.jumlahInvestasi)}
                            </td>
                            <td className="py-2.5 text-right tabular-nums text-slate-500">
                              {n.persentase.toFixed(2)}%
                            </td>
                            <td className="py-2.5 text-right tabular-nums font-semibold text-brand-700">
                              {formatRupiah(n.bagian)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-border font-bold text-slate-900">
                          <td className="py-2.5">Total</td>
                          <td className="py-2.5 text-right tabular-nums">
                            {formatRupiah(d.totalInvestasi)}
                          </td>
                          <td className="py-2.5 text-right tabular-nums">100%</td>
                          <td className="py-2.5 text-right tabular-nums text-brand-700">
                            {formatRupiah(
                              d.detail.reduce((s, n) => s + n.bagian, 0)
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Pembagian dibulatkan ke rupiah penuh. Sisa pembulatan diberikan
                  ke porsi terbesar lebih dulu, sehingga jumlah seluruh bagian
                  selalu persis sama dengan bagian nasabah di atas.
                </p>
              </CardContent>
            </Card>

            {/* Alokasi pengelola */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Alokasi Bagian Pengelola</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {d.bagianPengelola <= 0 && (
                  <p className="text-sm text-slate-500 mb-2">
                    Periode ini tidak menghasilkan laba, jadi tidak ada yang dialokasikan.
                  </p>
                )}
                <dl className="divide-y divide-border text-sm">
                  {ALOKASI_PENGELOLA.map((a, i) => (
                    <div key={a.nama} className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="text-slate-700">
                        {a.nama}
                        <span className="text-slate-400 ml-2 text-xs">{a.persen}%</span>
                      </dt>
                      <dd className="font-semibold tabular-nums text-slate-900 shrink-0">
                        {formatRupiah(hitungAlokasi(d.bagianPengelola)[i])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {dialog}

      <Dialog
        open={bukaDialog}
        onOpenChange={(buka) => {
          if (!buka && !membuka) {
            setBukaDialog(false);
            setAlasanBuka("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buka kembali {data?.label}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 leading-relaxed">
              Rekaman resmi periode ini akan dilepas supaya transaksinya bisa
              dikoreksi. Isinya — termasuk bagian setiap nasabah yang mungkin
              sudah dibayarkan — <strong>disimpan utuh di arsip</strong>, bersama
              nama Anda dan alasan di bawah.
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Saat ditutup ulang, daftar nasabah dan persentasenya tetap memakai
              yang lama. Kalau angka yang sudah dibayarkan berubah,{" "}
              <strong>beri tahu nasabah</strong>.
            </p>
            <div>
              <label htmlFor="alasan-buka" className="block text-sm font-medium text-slate-700">
                Alasan <span className="text-red-500">*</span>
              </label>
              <textarea
                id="alasan-buka"
                rows={3}
                value={alasanBuka}
                onChange={(e) => setAlasanBuka(e.target.value)}
                placeholder="Contoh: transaksi 28 September salah input, perlu dibatalkan"
                className="mt-1.5 flex w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">Minimal 10 karakter.</p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                disabled={membuka}
                onClick={() => {
                  setBukaDialog(false);
                  setAlasanBuka("");
                }}
              >
                Batal
              </Button>
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white"
                disabled={membuka || alasanBuka.trim().length < 10}
                onClick={bukaKembali}
              >
                {membuka ? "Membuka..." : "Buka Kembali"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
