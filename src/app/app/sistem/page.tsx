"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShortcutCard } from "@/components/ui/shortcut-card";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Settings, Clock, DatabaseBackup, ArrowRight, Store, Tags,
  Percent, ShieldCheck, CircleDot, Users, KeyRound, Printer,
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
      label: "Buka / Tutup Kasir",
      desc: "Buka kasir sebelum jualan, tutup setelah uang laci dihitung",
      icon: Clock,
      nada: "brand" as const,
    },
    {
      href: "/app/sistem/pengaturan",
      label: "Pengaturan Toko",
      desc: "Identitas toko, diskon, dan kategori",
      icon: Settings,
      nada: "gold" as const,
      adminSaja: true,
    },
    {
      href: "/app/sistem/pengguna",
      label: "Pengguna",
      desc: "Kelola akun dan hak akses",
      icon: Users,
      nada: "violet" as const,
      adminSaja: true,
      masterSaja: true,
    },
    {
      href: "/app/sistem/backup",
      label: "Unduh Data (Excel)",
      desc: "Simpan salinan data per bulan ke komputer",
      icon: DatabaseBackup,
      nada: "sky" as const,
      adminSaja: true,
    },
    {
      href: "/app/sistem/printer",
      label: "Printer",
      desc: "Printer thermal Bluetooth atau printer sistem, lebar kertas",
      icon: Printer,
      nada: "slate" as const,
    },
    {
      href: "/app/akun",
      label: "Akun Saya",
      desc: "Lihat akun dan ganti password",
      icon: KeyRound,
      nada: "brand" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pengaturan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pengaturan toko, buka/tutup kasir, printer, dan unduh data
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {pintasan
          .filter((p) => (isAdmin || !p.adminSaja) && (!p.masterSaja || user?.role === "master"))
          .map((p) => (
            <ShortcutCard key={p.href} href={p.href} label={p.label} desc={p.desc} icon={p.icon} nada={p.nada} />
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Informasi toko */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2.5">
                <CardIcon icon={Store} nada="brand" />
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
              <CardIcon icon={Percent} nada="gold" />
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
                  <p className="text-xs text-slate-500 mt-1">
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
                <CardIcon icon={Clock} nada="sky" />
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
              <CardIcon icon={ShieldCheck} nada="violet" />
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
