"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatRupiah } from "@/lib/utils";
import {
  DollarSign, TrendingUp, TrendingDown, Package, AlertTriangle, Clock,
  Award, BarChart3, Boxes, ArrowRight, Receipt, RefreshCw, Undo2,
  Wallet, UserPlus, Minus,
} from "lucide-react";
import { SalesChart } from "@/components/SalesChart";
import { Skeleton, StatsSkeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth";

const NILAI_UTAMA = [
  "Pelayanan Lebih Baik",
  "Usaha Lebih Maju",
  "Umat Lebih Sejahtera",
  "Berkah Untuk Semua",
];

const IKON_AKTIVITAS = {
  penjualan: Receipt,
  stok: RefreshCw,
  retur: Undo2,
  pengeluaran: Wallet,
  member: UserPlus,
} as const;

const WARNA_AKTIVITAS = {
  penjualan: "bg-brand-50 text-brand-600",
  stok: "bg-sky-50 text-sky-600",
  retur: "bg-amber-50 text-amber-600",
  pengeluaran: "bg-rose-50 text-rose-600",
  member: "bg-violet-50 text-violet-600",
} as const;

/** Indikator naik/turun pada kartu ringkasan. */
function Tren({ nilai, satuan }: { nilai: number | null; satuan: string }) {
  if (nilai === null) {
    return <p className="text-xs text-slate-400 mt-1.5">{satuan}</p>;
  }
  const naik = nilai >= 0;
  const Ikon = naik ? TrendingUp : TrendingDown;
  return (
    <p className="text-xs mt-1.5 flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-semibold",
          naik ? "text-brand-600" : "text-rose-600"
        )}
      >
        <Ikon className="h-3.5 w-3.5" />
        {naik ? "+" : ""}
        {nilai}%
      </span>
      <span className="text-slate-400">{satuan}</span>
    </p>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-card" />
        <StatsSkeleton />
        <Skeleton className="h-72 w-full rounded-card" />
      </div>
    );
  }

  const kartu = [
    {
      title: "Penjualan Hari Ini",
      value: formatRupiah(data.penjualanHariIni),
      icon: DollarSign,
      warna: "bg-brand-50 text-brand-700",
      latar: "bg-brand-50/50",
      tren: data.tren?.penjualan ?? null,
      satuan: "dari kemarin",
    },
    {
      title: "Laba Bulan Ini",
      value: formatRupiah(data.labaKotor ?? 0),
      icon: TrendingUp,
      warna: "bg-gold-50 text-gold-600",
      latar: "bg-gold-50/40",
      tren: data.tren?.laba ?? null,
      satuan: "dari bulan lalu",
    },
    {
      title: "Stok Rendah",
      value: `${data.stokRendah} produk`,
      icon: AlertTriangle,
      warna: "bg-rose-50 text-rose-600",
      latar: "bg-rose-50/40",
      tren: null,
      satuan: data.stokRendah > 0 ? "Perlu restock segera" : "Semua stok aman",
    },
    {
      title: "Produk Aktif",
      value: `${data.totalBarang} produk`,
      icon: Package,
      warna: "bg-sky-50 text-sky-600",
      latar: "bg-sky-50/40",
      tren: data.tren?.produk ?? null,
      satuan: "dari bulan lalu",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sambutan — ringkas, tanpa panel berwarna tebal */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            Selamat datang{user?.nama ? `, ${user.nama.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mari bersama membangun ekonomi umat melalui Gerai BKMT.
          </p>
        </div>
        <p className="hidden sm:block font-script text-xl text-brand-600">
          Bersama Umat, Membangun Masyarakat
        </p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kartu.map((c) => (
          <div
            key={c.title}
            className={cn(
              "rounded-card border border-border p-5 transition-colors",
              c.latar
            )}
          >
            <span
              className={cn(
                "inline-flex h-9 w-9 rounded-lg items-center justify-center",
                c.warna
              )}
            >
              <c.icon className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-3.5 text-[13px] font-medium text-slate-500">{c.title}</p>
            <p
              title={String(c.value)}
              className="mt-1 text-[22px] font-bold text-slate-900 truncate tracking-tight"
            >
              {c.value}
            </p>
            <Tren nilai={c.tren} satuan={c.satuan} />
          </div>
        ))}
      </div>

      {/* Grafik + transaksi */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card className="xl:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <BarChart3 className="h-[18px] w-[18px]" />
                </span>
                Grafik Penjualan &amp; Laba
              </CardTitle>
              <span className="text-xs text-slate-500">12 bulan terakhir</span>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-sm bg-brand-500" /> Penjualan
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-sm bg-gold-400" /> Laba
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <SalesChart data={data.chartData} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Clock className="h-[18px] w-[18px]" />
                </span>
                Transaksi Terbaru
              </CardTitle>
              <Link
                href="/app/keuangan/penjualan"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Lihat semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.transaksiTerbaru.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Clock className="h-9 w-9 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada transaksi</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data.transaksiTerbaru.map((t: any) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {t.nomorTransaksi}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t.member?.nama || "Umum"} ·{" "}
                        {new Date(t.tanggal).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-brand-700">
                        {formatRupiah(t.total)}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {t.metodeBayar}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Terlaris + inventori + aktivitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center">
                <Award className="h-[18px] w-[18px]" />
              </span>
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.produkTerlaris.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400">Belum ada data</p>
            ) : (
              <ol className="space-y-3">
                {data.produkTerlaris.map((p: any, idx: number) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className="shrink-0 h-7 w-7 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {p.nama}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatRupiah(p.hargaJual)}
                      </p>
                    </div>
                    <Badge variant="gold" className="shrink-0">
                      {p.totalTerjual} terjual
                    </Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Boxes className="h-[18px] w-[18px]" />
                </span>
                Status Inventori
              </CardTitle>
              <Link
                href="/app/inventori/stok"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Lihat semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.barangStokRendah.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400">
                Semua stok dalam batas aman
              </p>
            ) : (
              <ul className="space-y-2.5">
                {data.barangStokRendah.slice(0, 5).map((b: any) => (
                  <li key={b.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {b.nama}
                      </p>
                      <p className="text-xs text-slate-400">{b.kode}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 shrink-0">
                      {b.stok}
                    </span>
                    <Badge
                      variant={b.stok === 0 ? "destructive" : "warning"}
                      className="shrink-0"
                    >
                      {b.stok === 0 ? "Habis" : "Menipis"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Minus className="h-[18px] w-[18px] rotate-90" />
              </span>
              Aktivitas Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data.aktivitas || data.aktivitas.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400">
                Belum ada aktivitas hari ini
              </p>
            ) : (
              <ul className="space-y-3.5">
                {data.aktivitas.map((a: any, i: number) => {
                  const Ikon = IKON_AKTIVITAS[a.jenis as keyof typeof IKON_AKTIVITAS];
                  return (
                    <li key={i} className="flex gap-3">
                      <span
                        className={cn(
                          "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
                          WARNA_AKTIVITAS[a.jenis as keyof typeof WARNA_AKTIVITAS]
                        )}
                      >
                        <Ikon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {a.judul}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {new Date(a.waktu).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {a.detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
