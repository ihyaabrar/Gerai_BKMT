"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRupiah } from "@/lib/utils";
import {
  Receipt, Wallet, PieChart, FileBarChart, ArrowRight,
  TrendingUp, TrendingDown, Percent, Coins, Lock,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const PINTASAN = [
  {
    href: "/app/keuangan/penjualan",
    label: "Penjualan",
    desc: "Pemasukan dari penjualan produk",
    icon: Receipt,
    warna: "bg-brand-50 text-brand-600",
  },
  {
    href: "/app/keuangan/pengeluaran",
    label: "Pengeluaran",
    desc: "Kelola biaya operasional dan pengeluaran",
    icon: Wallet,
    warna: "bg-gold-50 text-gold-600",
  },
  {
    href: "/app/keuangan/distribusi",
    label: "Distribusi Laba",
    desc: "Pembagian keuntungan usaha",
    icon: PieChart,
    warna: "bg-sky-50 text-sky-600",
    adminSaja: true,
  },
  {
    href: "/app/keuangan/laporan",
    label: "Laporan Keuangan",
    desc: "Lihat laporan dan rekapitulasi lengkap",
    icon: FileBarChart,
    warna: "bg-violet-50 text-violet-600",
    adminSaja: true,
  },
];

export default function KeuanganPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "master" || user?.role === "admin";

  const [ringkasan, setRingkasan] = useState<{
    penjualan: number;
    pengeluaran: number;
    laba: number;
  } | null>(null);
  const [loading, setLoading] = useState(isAdmin);

  // Ringkasan keuangan hanya diambil untuk master/admin — endpoint laporan
  // memang tertutup bagi kasir, jadi bagian ini disembunyikan untuk mereka.
  useEffect(() => {
    if (!isAdmin) return;

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = now.toISOString();

    const ambil = async () => {
      try {
        const [resJual, resKeluar] = await Promise.all([
          fetch(`/api/laporan?type=penjualan&startDate=${start}&endDate=${end}`),
          fetch(`/api/laporan?type=pengeluaran&startDate=${start}&endDate=${end}`),
        ]);
        if (!resJual.ok || !resKeluar.ok) return;

        const jual = await resJual.json();
        const keluar = await resKeluar.json();
        setRingkasan({
          penjualan: jual.totalPenjualan ?? 0,
          pengeluaran: keluar.totalPengeluaran ?? 0,
          laba: jual.totalLaba ?? 0,
        });
      } finally {
        setLoading(false);
      }
    };
    ambil();
  }, [isAdmin]);

  const labaBersih = ringkasan ? ringkasan.laba - ringkasan.pengeluaran : 0;
  const margin =
    ringkasan && ringkasan.penjualan > 0
      ? (labaBersih / ringkasan.penjualan) * 100
      : 0;

  const kartu = [
    {
      label: "Total Penjualan",
      nilai: formatRupiah(ringkasan?.penjualan ?? 0),
      icon: TrendingUp,
      warna: "bg-brand-50 text-brand-600",
      negatif: false,
    },
    {
      label: "Total Pengeluaran",
      nilai: formatRupiah(ringkasan?.pengeluaran ?? 0),
      icon: TrendingDown,
      warna: "bg-rose-50 text-rose-600",
      negatif: false,
    },
    {
      label: "Laba Bersih",
      nilai: formatRupiah(labaBersih),
      icon: Coins,
      warna: "bg-gold-50 text-gold-600",
      // Angka negatif diberi warna peringatan, bukan disembunyikan —
      // pengeluaran yang melebihi laba memang perlu terlihat.
      negatif: labaBersih < 0,
    },
    {
      label: "Margin Laba",
      nilai: `${margin.toFixed(1)}%`,
      icon: Percent,
      warna: "bg-sky-50 text-sky-600",
      negatif: margin < 0,
    },
  ];

  const bulanIni = new Date().toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Keuangan</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Pantau penjualan, pengeluaran, distribusi laba, dan laporan keuangan
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PINTASAN.filter((p) => isAdmin || !p.adminSaja).map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group rounded-card border border-border bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0",
                  p.warna
                )}
              >
                <p.icon className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </div>
            <p className="mt-3.5 font-bold text-slate-900">{p.label}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
          </Link>
        ))}
      </div>

      {!isAdmin ? (
        <Card>
          <CardContent className="p-6 pt-6 flex items-start gap-4">
            <span className="shrink-0 h-11 w-11 rounded-xl bg-surface-sunken text-slate-500 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">
                Ringkasan keuangan hanya untuk pengelola
              </p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Akun kasir dapat mencatat penjualan dan pengeluaran, tetapi angka
                laba serta laporan keuangan hanya bisa dilihat oleh master/admin.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">
              Ringkasan {bulanIni}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {kartu.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-5 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-500">{c.label}</p>
                      {loading ? (
                        <Skeleton className="h-7 w-28 mt-2" />
                      ) : (
                        <p
                          title={c.nilai}
                          className={cn(
                            "mt-1.5 text-xl sm:text-2xl font-extrabold truncate",
                            c.negatif ? "text-rose-600" : "text-brand-900"
                          )}
                        >
                          {c.nilai}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center",
                        c.warna
                      )}
                    >
                      <c.icon className="h-5 w-5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Komposisi Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              {loading || !ringkasan ? (
                <Skeleton className="h-24 w-full rounded-xl" />
              ) : ringkasan.penjualan === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  Belum ada transaksi bulan ini
                </p>
              ) : (
                <div className="space-y-4">
                  {[
                    {
                      label: "Penjualan",
                      nilai: ringkasan.penjualan,
                      kelas: "bg-brand-500",
                    },
                    {
                      label: "Laba kotor",
                      nilai: ringkasan.laba,
                      kelas: "bg-gold-400",
                    },
                    {
                      label: "Pengeluaran operasional",
                      nilai: ringkasan.pengeluaran,
                      kelas: "bg-rose-400",
                    },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-semibold text-slate-900">
                          {formatRupiah(b.nilai)}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-surface-sunken overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", b.kelas)}
                          style={{
                            width: `${Math.min(
                              100,
                              (b.nilai / ringkasan.penjualan) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
