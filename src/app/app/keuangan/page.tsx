"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { ShortcutCard } from "@/components/ui/shortcut-card";
import { StatCard } from "@/components/ui/stat-card";
import type { Nada } from "@/components/ui/nada";
import { cn, formatRupiah } from "@/lib/utils";
import {
  Receipt, Wallet, PieChart, FileBarChart, TrendingUp, Coins, Lock,
  ShoppingBag, Info, Scale,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const PINTASAN: {
  href: string; label: string; desc: string; icon: typeof Receipt; nada: Nada; adminSaja?: boolean;
}[] = [
  { href: "/app/keuangan/penjualan", label: "Riwayat Penjualan", desc: "Semua transaksi penjualan, cetak ulang struk", icon: Receipt, nada: "brand" },
  { href: "/app/keuangan/pengeluaran", label: "Pengeluaran", desc: "Catat biaya operasional seperti listrik dan plastik", icon: Wallet, nada: "gold" },
  { href: "/app/keuangan/distribusi", label: "Bagi Hasil Nasabah", desc: "Bagian keuntungan nasabah setiap bulan", icon: PieChart, nada: "sky", adminSaja: true },
  { href: "/app/keuangan/laporan", label: "Laporan", desc: "Penjualan per hari dan barang paling laku", icon: FileBarChart, nada: "violet", adminSaja: true },
];

interface Ringkasan {
  penjualan: number;
  transaksi: number;
  hpp: number;
  /** Uang retur pembeli dikurangi modal barang yang kembali ke rak. */
  retur: number;
  rusak: number;
  labaKotor: number;
  operasional: number;
  belanjaStok: number;
}

export default function KeuanganPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "master" || user?.role === "admin";

  const [r, setR] = useState<Ringkasan | null>(null);
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
        const penjualan = jual.totalPenjualan ?? 0;
        const hpp = jual.totalHpp ?? 0;
        const labaSetelahRetur = jual.totalLaba ?? 0;
        const rusak = jual.kerugianStok ?? 0;
        setR({
          penjualan,
          transaksi: jual.totalTransaksi ?? 0,
          hpp,
          retur: Math.max(0, penjualan - hpp - labaSetelahRetur),
          rusak,
          // Sama dengan "laba yang dibagi" di Bagi Hasil Nasabah dan "Laba
          // Bulan Ini" di Beranda: barang rusak/hilang ikut mengurangi.
          labaKotor: jual.labaDibagi ?? labaSetelahRetur - rusak,
          operasional: keluar.totalPengeluaranOperasional ?? 0,
          belanjaStok: keluar.totalPembelianBarang ?? 0,
        });
      } finally {
        setLoading(false);
      }
    };
    ambil();
  }, [isAdmin]);

  // Pembelian barang dagangan tidak dikurangkan di sini: modalnya sudah
  // terhitung sebagai harga pokok pada setiap penjualan.
  const labaBersih = r ? r.labaKotor - r.operasional : 0;
  const margin = r && r.penjualan > 0 ? (labaBersih / r.penjualan) * 100 : 0;

  const bulanIni = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        judul="Keuangan"
        deskripsi="Pantau penjualan, pengeluaran, bagi hasil, dan laporan."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PINTASAN.filter((p) => isAdmin || !p.adminSaja).map((p) => (
          <ShortcutCard key={p.href} {...p} />
        ))}
      </div>

      {!isAdmin ? (
        <Card>
          <CardContent className="flex items-start gap-4">
            <span className="shrink-0 h-11 w-11 rounded-xl bg-surface-sunken text-slate-500 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Ringkasan keuangan hanya untuk pengurus</p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Akun kasir dapat mencatat penjualan dan pengeluaran, tetapi angka laba dan laporan
                keuangan hanya bisa dilihat oleh pengurus.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <h2 className="text-lg font-bold text-slate-900 pt-2">Ringkasan {bulanIni}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Penjualan"
              nilai={formatRupiah(r?.penjualan ?? 0)}
              icon={TrendingUp}
              nada="brand"
              catatan={`${r?.transaksi ?? 0} transaksi`}
              loading={loading}
            />
            <StatCard
              label="Laba Kotor"
              nilai={formatRupiah(r?.labaKotor ?? 0)}
              icon={Coins}
              nada="gold"
              catatan="Setelah modal barang, retur, dan barang rusak"
              negatif={(r?.labaKotor ?? 0) < 0}
              loading={loading}
            />
            <StatCard
              label="Biaya Operasional"
              nilai={formatRupiah(r?.operasional ?? 0)}
              icon={Wallet}
              nada="rose"
              catatan="Listrik, plastik, transport, dll."
              loading={loading}
            />
            <StatCard
              label="Laba Bersih"
              nilai={formatRupiah(labaBersih)}
              icon={Scale}
              nada="sky"
              catatan={`${margin.toFixed(1)}% dari penjualan`}
              negatif={labaBersih < 0}
              loading={loading}
            />
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5">
                <CardIcon icon={PieChart} nada="brand" />
                Ke Mana Uang Penjualan Pergi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading || !r ? (
                <Skeleton className="h-40 w-full rounded-xl" />
              ) : r.penjualan === 0 && r.operasional === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">Belum ada transaksi bulan ini.</p>
              ) : (
                <Komposisi r={r} labaBersih={labaBersih} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Komposisi({ r, labaBersih }: { r: Ringkasan; labaBersih: number }) {
  const bagian = [
    { label: "Modal barang terjual", nilai: r.hpp, warna: "bg-slate-300" },
    { label: "Retur & barang rusak", nilai: r.retur + r.rusak, warna: "bg-amber-400" },
    { label: "Biaya operasional", nilai: r.operasional, warna: "bg-rose-400" },
    { label: "Laba bersih", nilai: Math.max(0, labaBersih), warna: "bg-brand-500" },
  ].filter((b) => b.nilai > 0);
  // Bila biaya melebihi penjualan, batang diukur dari total biaya supaya
  // tetap penuh dan tidak meluber.
  const dasar = Math.max(r.penjualan, bagian.reduce((s, b) => s + b.nilai, 0)) || 1;
  const persen = (n: number) => (r.penjualan > 0 ? `${Math.round((n / r.penjualan) * 100)}%` : "–");

  const rincian: { label: string; nilai: number; tanda?: "+" | "−"; tebal?: boolean; catatan?: string }[] = [
    { label: "Penjualan diterima", nilai: r.penjualan, tanda: "+", catatan: "Sudah dipotong diskon member" },
    { label: "Modal barang terjual", nilai: r.hpp, tanda: "−", catatan: "Harga beli barang yang laku" },
    ...(r.retur > 0 ? [{ label: "Retur pembeli", nilai: r.retur, tanda: "−" as const }] : []),
    ...(r.rusak > 0 ? [{ label: "Barang rusak / hilang", nilai: r.rusak, tanda: "−" as const }] : []),
    { label: "Laba kotor", nilai: r.labaKotor, tebal: true },
    { label: "Biaya operasional", nilai: r.operasional, tanda: "−" },
    { label: "Laba bersih", nilai: labaBersih, tebal: true },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
      <div>
        <p className="text-sm text-slate-500">
          Dari setiap <strong className="text-slate-700">Rp100</strong> penjualan bulan ini:
        </p>
        <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-surface-sunken">
          {bagian.map((b) => (
            <div
              key={b.label}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", b.warna)}
              style={{ width: `${(b.nilai / dasar) * 100}%` }}
              title={`${b.label}: ${formatRupiah(b.nilai)}`}
            />
          ))}
        </div>
        <ul className="mt-5 space-y-3">
          {bagian.map((b) => (
            <li key={b.label} className="flex items-center gap-3 text-sm">
              <span className={cn("h-3 w-3 rounded-full shrink-0", b.warna)} />
              <span className="text-slate-600 flex-1 min-w-0">{b.label}</span>
              <span className="text-slate-400 tabular-nums w-10 text-right hidden sm:inline">{persen(b.nilai)}</span>
              <span className="font-semibold text-slate-900 tabular-nums sm:w-28 text-right shrink-0">{formatRupiah(b.nilai)}</span>
            </li>
          ))}
        </ul>
        {labaBersih < 0 && (
          <p className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">
            Biaya bulan ini lebih besar dari penjualan — rugi {formatRupiah(-labaBersih)}.
          </p>
        )}
      </div>

      <div>
        <dl className="divide-y divide-border rounded-xl border border-border">
          {rincian.map((b) => (
            <div
              key={b.label}
              className={cn("flex items-baseline justify-between gap-4 px-4 py-3", b.tebal && "bg-surface-sunken/60")}
            >
              <div className="min-w-0">
                <dt className={cn("text-sm", b.tebal ? "font-bold text-slate-900" : "text-slate-600")}>{b.label}</dt>
                {b.catatan && <p className="text-xs text-slate-500 mt-0.5">{b.catatan}</p>}
              </div>
              <dd
                className={cn(
                  "tabular-nums shrink-0 text-sm",
                  b.tebal ? "font-extrabold" : "font-semibold",
                  b.tanda === "−" || b.nilai < 0 ? "text-rose-600" : b.tebal ? "text-brand-700" : "text-slate-900"
                )}
              >
                {b.tanda === "−" && b.nilai > 0 ? "−" : ""}
                {formatRupiah(b.nilai)}
              </dd>
            </div>
          ))}
        </dl>

        {r.belanjaStok > 0 && (
          <div className="mt-4 flex gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3">
            <ShoppingBag className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-sm text-sky-900 leading-relaxed">
              Belanja stok bulan ini <strong>{formatRupiah(r.belanjaStok)}</strong> tidak dihitung sebagai
              biaya. Uangnya berubah menjadi barang di rak, dan baru mengurangi laba sebagai modal
              barang saat barangnya terjual.
            </p>
          </div>
        )}
        {r.belanjaStok === 0 && (
          <p className="mt-4 flex gap-2 text-xs text-slate-500">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            Belanja stok barang tidak dihitung sebagai biaya; modalnya masuk saat barang terjual.
          </p>
        )}
      </div>
    </div>
  );
}
