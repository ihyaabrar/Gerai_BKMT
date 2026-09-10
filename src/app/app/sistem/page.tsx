"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Settings, Clock, DatabaseBackup, ArrowRight, Store, Tags,
  Percent, ShieldCheck, CircleDot,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface Pengaturan {
  namaToko: string;
  alamatToko: string | null;
  teleponToko: string | null;
  prefixTransaksi: string;
  diskonMember: number;
  persenNasabah: number;
  persenPengelola: number;
}

interface Shift {
  id: string;
  jamBuka: string;
  saldoAwal: number;
  user: { nama: string };
}

export default function SistemPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "master" || user?.role === "admin";

  const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null);
  const [shiftAktif, setShiftAktif] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ambil = async () => {
      try {
        const [resSet, resShift] = await Promise.all([
          fetch("/api/pengaturan"),
          fetch("/api/shift"),
        ]);
        if (resSet.ok) setPengaturan(await resSet.json());
        if (resShift.ok) {
          const d = await resShift.json();
          setShiftAktif(d.shiftAktif ?? null);
        }
      } finally {
        setLoading(false);
      }
    };
    ambil();
  }, []);

  const pintasan = [
    {
      href: "/app/sistem/shift",
      label: "Shift Kasir",
      desc: "Buka, tutup, dan rekap shift kasir",
      icon: Clock,
      warna: "bg-brand-50 text-brand-600",
    },
    {
      href: "/app/sistem/pengaturan",
      label: "Pengaturan Toko",
      desc: "Identitas toko, diskon, dan kategori",
      icon: Settings,
      warna: "bg-gold-50 text-gold-600",
      adminSaja: true,
    },
    {
      href: "/app/sistem/backup",
      label: "Backup & Restore",
      desc: "Unduh salinan seluruh data",
      icon: DatabaseBackup,
      warna: "bg-sky-50 text-sky-600",
      adminSaja: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sistem</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Pengaturan toko, shift kasir, backup, dan informasi sistem
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {pintasan
          .filter((p) => isAdmin || !p.adminSaja)
          .map((p) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Informasi toko */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Store className="h-[18px] w-[18px]" />
                </span>
                Informasi Toko
              </CardTitle>
              {isAdmin && (
                <Link
                  href="/app/sistem/pengaturan"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Ubah <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : !pengaturan ? (
              <p className="text-sm text-slate-400 py-4">Pengaturan belum tersedia</p>
            ) : (
              <dl className="divide-y divide-border text-sm">
                {[
                  { k: "Nama Toko", v: pengaturan.namaToko },
                  { k: "Alamat", v: pengaturan.alamatToko || "-" },
                  { k: "Telepon", v: pengaturan.teleponToko || "-" },
                  { k: "Prefix Transaksi", v: pengaturan.prefixTransaksi },
                ].map((baris) => (
                  <div
                    key={baris.k}
                    className="flex items-start justify-between gap-4 py-2.5 first:pt-0"
                  >
                    <dt className="text-slate-500 shrink-0">{baris.k}</dt>
                    <dd className="font-medium text-slate-900 text-right break-words">
                      {baris.v}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Aturan berjalan */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center">
                <Percent className="h-[18px] w-[18px]" />
              </span>
              Aturan Berjalan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : !pengaturan ? (
              <p className="text-sm text-slate-400 py-4">Belum tersedia</p>
            ) : (
              <>
                <div className="rounded-xl bg-surface-sunken/70 p-4">
                  <p className="text-xs text-slate-500">Diskon Member</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {pengaturan.diskonMember}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dihitung otomatis di server saat transaksi
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Bagi Hasil</p>
                  <div className="flex h-3 rounded-full overflow-hidden bg-surface-sunken">
                    <div
                      className="bg-brand-500"
                      style={{ width: `${pengaturan.persenNasabah}%` }}
                    />
                    <div
                      className="bg-gold-400"
                      style={{ width: `${pengaturan.persenPengelola}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
                      Nasabah {pengaturan.persenNasabah}%
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-sm bg-gold-400" />
                      Pengelola {pengaturan.persenPengelola}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Status shift */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Clock className="h-[18px] w-[18px]" />
                </span>
                Status Shift
              </CardTitle>
              <Link
                href="/app/sistem/shift"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Kelola <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-16 w-full rounded-xl" />
            ) : shiftAktif ? (
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500 animate-pulse shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate">
                    Shift aktif — {shiftAktif.user?.nama ?? "Kasir"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dibuka{" "}
                    {new Date(shiftAktif.jamBuka).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge className="shrink-0">Buka</Badge>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CircleDot className="h-4 w-4 text-slate-300 shrink-0" />
                <p className="text-sm text-slate-500 flex-1">
                  Tidak ada shift yang sedang berjalan
                </p>
                <Badge variant="secondary" className="shrink-0">
                  Tutup
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informasi sistem */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <ShieldCheck className="h-[18px] w-[18px]" />
              </span>
              Informasi Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border text-sm">
              {[
                { k: "Database", v: "PostgreSQL", badge: null, kapital: false },
                { k: "Peran Anda", v: user?.role ?? "-", badge: null, kapital: true },
                {
                  k: "Sesi",
                  v: "Cookie bertanda tangan, berlaku 12 jam",
                  badge: "Aman",
                  kapital: false,
                },
                {
                  k: "Kategori Produk",
                  v: "Dikelola di Pengaturan",
                  badge: null,
                  kapital: false,
                },
              ].map((baris) => (
                <div
                  key={baris.k}
                  className="flex items-start justify-between gap-4 py-2.5 first:pt-0"
                >
                  <dt className="text-slate-500 shrink-0">{baris.k}</dt>
                  <dd className="font-medium text-slate-900 text-right flex items-center gap-2 justify-end">
                    <span className={cn("break-words", baris.kapital && "capitalize")}>
                      {baris.v}
                    </span>
                    {baris.badge && <Badge>{baris.badge}</Badge>}
                  </dd>
                </div>
              ))}
            </dl>
            {isAdmin && (
              <Link
                href="/app/sistem/pengaturan"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <Tags className="h-3.5 w-3.5" />
                Kelola kategori produk &amp; pengeluaran
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
