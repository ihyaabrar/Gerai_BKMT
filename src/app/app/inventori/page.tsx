"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { cn, formatRupiah } from "@/lib/utils";
import {
  PackagePlus, Boxes, ClipboardCheck, Undo2, ArrowRight, Search,
  Package, ShieldCheck, AlertTriangle, XCircle, Wallet,
} from "lucide-react";
import { toast } from "sonner";

interface Barang {
  id: string;
  kode: string;
  nama: string;
  kategori: string | null;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  stokMinimum: number;
  satuan: string;
}

const PINTASAN = [
  {
    href: "/app/inventori/barang-masuk",
    label: "Barang Masuk",
    desc: "Pencatatan stok masuk dari supplier",
    icon: PackagePlus,
    warna: "bg-brand-100 text-brand-700",
  },
  {
    href: "/app/inventori/stok",
    label: "Stok Barang",
    desc: "Lihat dan kelola stok produk",
    icon: Boxes,
    warna: "bg-gold-100 text-gold-700",
  },
  {
    href: "/app/inventori/penyesuaian",
    label: "Penyesuaian Stok",
    desc: "Koreksi stok barang di gudang",
    icon: ClipboardCheck,
    warna: "bg-sky-100 text-sky-700",
  },
  {
    href: "/app/inventori/retur",
    label: "Retur Barang",
    desc: "Kelola barang retur dan rusak",
    icon: Undo2,
    warna: "bg-rose-100 text-rose-700",
  },
];

type Saringan = "semua" | "menipis" | "habis";

export default function InventoriPage() {
  const [barang, setBarang] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);
  const [saringan, setSaringan] = useState<Saringan>("semua");
  const [cari, setCari] = useState("");

  useEffect(() => {
    fetch("/api/barang")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setBarang(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Gagal memuat data inventori"))
      .finally(() => setLoading(false));
  }, []);

  const ringkasan = useMemo(() => {
    const habis = barang.filter((b) => b.stok === 0);
    const menipis = barang.filter((b) => b.stok > 0 && b.stok <= b.stokMinimum);
    const aman = barang.filter((b) => b.stok > b.stokMinimum);
    const nilai = barang.reduce((n, b) => n + b.hargaBeli * b.stok, 0);
    return { habis, menipis, aman, nilai };
  }, [barang]);

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    let hasil = barang;
    if (saringan === "menipis") hasil = ringkasan.menipis;
    if (saringan === "habis") hasil = ringkasan.habis;
    if (!q) return hasil;
    return hasil.filter(
      (b) =>
        b.nama.toLowerCase().includes(q) ||
        b.kode.toLowerCase().includes(q) ||
        (b.kategori ?? "").toLowerCase().includes(q)
    );
  }, [barang, saringan, cari, ringkasan]);

  const tab: { id: Saringan; label: string; jumlah: number }[] = [
    { id: "semua", label: "Semua", jumlah: barang.length },
    { id: "menipis", label: "Stok Menipis", jumlah: ringkasan.menipis.length },
    { id: "habis", label: "Stok Habis", jumlah: ringkasan.habis.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-900">Inventori</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Kelola stok barang, barang masuk, penyesuaian, dan retur dengan mudah
        </p>
      </div>

      {/* Pintasan menu inventori */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PINTASAN.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group rounded-card border border-brand-100/70 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
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
            <p className="mt-3.5 font-bold text-brand-900">{p.label}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Ringkasan stok */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Ringkasan Stok</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Total Produk",
                    nilai: barang.length,
                    icon: Package,
                    warna: "bg-brand-100 text-brand-700",
                  },
                  {
                    label: "Stok Aman",
                    nilai: ringkasan.aman.length,
                    icon: ShieldCheck,
                    warna: "bg-sky-100 text-sky-700",
                  },
                  {
                    label: "Stok Menipis",
                    nilai: ringkasan.menipis.length,
                    icon: AlertTriangle,
                    warna: "bg-amber-100 text-amber-700",
                  },
                  {
                    label: "Stok Habis",
                    nilai: ringkasan.habis.length,
                    icon: XCircle,
                    warna: "bg-rose-100 text-rose-700",
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="rounded-xl bg-surface-sunken/70 p-3.5"
                  >
                    <span
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        r.warna
                      )}
                    >
                      <r.icon className="h-4 w-4" />
                    </span>
                    <p className="mt-2.5 text-xl font-extrabold text-brand-900">
                      {r.nilai}
                    </p>
                    <p className="text-[11px] text-slate-500">{r.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-deep border-0">
            <CardContent className="p-5 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-brand-200">Nilai Persediaan</p>
                  <p className="mt-1.5 text-2xl font-extrabold text-white break-words">
                    {formatRupiah(ringkasan.nilai)}
                  </p>
                  <p className="text-xs text-brand-300 mt-1.5">
                    Dihitung dari harga beli &times; stok
                  </p>
                </div>
                <span className="shrink-0 h-11 w-11 rounded-2xl bg-white/10 text-gold-300 flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daftar produk */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Data Produk</CardTitle>
              <Link
                href="/app/inventori/stok"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Lihat semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {tab.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSaringan(t.id)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    saringan === t.id
                      ? "bg-brand-600 text-white"
                      : "bg-surface-sunken text-slate-600 hover:bg-brand-100"
                  )}
                >
                  {t.label} ({t.jumlah})
                </button>
              ))}
              <div className="relative ml-auto w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  aria-label="Cari produk"
                  placeholder="Cari produk..."
                  value={cari}
                  onChange={(e) => setCari(e.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <TableSkeleton cols={5} />
            ) : tersaring.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Package className="h-11 w-11 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {cari ? "Produk tidak ditemukan" : "Belum ada produk"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-brand-100 text-left text-slate-500">
                      <th className="py-2.5 pr-4 font-semibold">Produk</th>
                      <th className="py-2.5 px-4 font-semibold">Kategori</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Harga</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Stok</th>
                      <th className="py-2.5 pl-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tersaring.slice(0, 8).map((b) => {
                      const habis = b.stok === 0;
                      const menipis = !habis && b.stok <= b.stokMinimum;
                      return (
                        <tr
                          key={b.id}
                          className="border-b border-brand-100/60 last:border-0"
                        >
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-brand-900">{b.nama}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{b.kode}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {b.kategori || "-"}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-brand-900">
                            {formatRupiah(b.hargaJual)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-brand-900">
                            {b.stok}{" "}
                            <span className="font-normal text-xs text-slate-400">
                              {b.satuan}
                            </span>
                          </td>
                          <td className="py-3 pl-4 text-center">
                            <Badge
                              variant={
                                habis ? "destructive" : menipis ? "warning" : "default"
                              }
                            >
                              {habis ? "Habis" : menipis ? "Menipis" : "Aman"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {tersaring.length > 8 && (
                  <p className="text-xs text-slate-400 pt-3">
                    Menampilkan 8 dari {tersaring.length} produk
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
