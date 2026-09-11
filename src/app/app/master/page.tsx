"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { cn, formatRupiah } from "@/lib/utils";
import {
  Users, PiggyBank, Truck, ArrowRight, Search, UserPlus, CheckCircle2,
  Coins, Settings2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

interface Member {
  id: string;
  kode: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  poin: number;
  createdAt?: string;
}

interface Nasabah {
  id: string;
  nama: string;
  telepon: string | null;
  jumlahInvestasi: number;
  persentase: number;
}

interface Supplier {
  id: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
}

type Tab = "member" | "nasabah" | "supplier";

export default function MasterDataPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "master" || user?.role === "admin";

  const [tab, setTab] = useState<Tab>("member");
  const [cari, setCari] = useState("");
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member[]>([]);
  const [nasabah, setNasabah] = useState<Nasabah[]>([]);
  const [supplier, setSupplier] = useState<Supplier[]>([]);

  useEffect(() => {
    const ambil = async () => {
      try {
        // Nasabah hanya boleh diakses master/admin, jadi tidak diminta
        // untuk kasir agar tidak memicu 403 yang tidak perlu.
        const permintaan: Promise<Response>[] = [
          fetch("/api/member"),
          fetch("/api/supplier"),
        ];
        if (isAdmin) permintaan.push(fetch("/api/nasabah"));

        const hasil = await Promise.all(permintaan);
        if (hasil.some((r) => !r.ok)) throw new Error();

        const [dMember, dSupplier, dNasabah] = await Promise.all(
          hasil.map((r) => r.json())
        );
        setMember(Array.isArray(dMember) ? dMember : []);
        setSupplier(Array.isArray(dSupplier) ? dSupplier : []);
        if (dNasabah) setNasabah(Array.isArray(dNasabah) ? dNasabah : []);
      } catch {
        toast.error("Gagal memuat data master");
      } finally {
        setLoading(false);
      }
    };
    ambil();
  }, [isAdmin]);

  const totalInvestasi = nasabah.reduce((n, x) => n + x.jumlahInvestasi, 0);
  const totalPoin = member.reduce((n, m) => n + m.poin, 0);

  const daftarTab = [
    { id: "member" as Tab, label: "Member", jumlah: member.length, icon: Users },
    ...(isAdmin
      ? [
          {
            id: "nasabah" as Tab,
            label: "Nasabah",
            jumlah: nasabah.length,
            icon: PiggyBank,
          },
        ]
      : []),
    { id: "supplier" as Tab, label: "Supplier", jumlah: supplier.length, icon: Truck },
  ];

  const ringkasan = {
    member: [
      { label: "Total Member", nilai: String(member.length), icon: Users, warna: "bg-brand-50 text-brand-600" },
      { label: "Total Poin", nilai: totalPoin.toLocaleString("id-ID"), icon: CheckCircle2, warna: "bg-gold-50 text-gold-600" },
      { label: "Rata-rata Poin", nilai: member.length ? Math.round(totalPoin / member.length).toLocaleString("id-ID") : "0", icon: UserPlus, warna: "bg-sky-50 text-sky-600" },
    ],
    nasabah: [
      { label: "Total Nasabah", nilai: String(nasabah.length), icon: PiggyBank, warna: "bg-brand-50 text-brand-600" },
      { label: "Total Investasi", nilai: formatRupiah(totalInvestasi), icon: Coins, warna: "bg-gold-50 text-gold-600" },
      { label: "Rata-rata Porsi", nilai: nasabah.length ? `${(100 / nasabah.length).toFixed(1)}%` : "0%", icon: CheckCircle2, warna: "bg-sky-50 text-sky-600" },
    ],
    supplier: [
      { label: "Total Supplier", nilai: String(supplier.length), icon: Truck, warna: "bg-brand-50 text-brand-600" },
      { label: "Punya Telepon", nilai: String(supplier.filter((s) => s.telepon).length), icon: CheckCircle2, warna: "bg-gold-50 text-gold-600" },
      { label: "Punya Alamat", nilai: String(supplier.filter((s) => s.alamat).length), icon: UserPlus, warna: "bg-sky-50 text-sky-600" },
    ],
  }[tab];

  const tautanKelola = {
    member: "/app/master/member",
    nasabah: "/app/master/nasabah",
    supplier: "/app/master/supplier",
  }[tab];

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    const cocok = (teks: string) => teks.toLowerCase().includes(q);

    if (tab === "member") {
      return q ? member.filter((m) => cocok(m.nama) || cocok(m.kode)) : member;
    }
    if (tab === "nasabah") {
      return q ? nasabah.filter((n) => cocok(n.nama)) : nasabah;
    }
    return q ? supplier.filter((s) => cocok(s.nama)) : supplier;
  }, [tab, cari, member, nasabah, supplier]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Master Data</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola data member, nasabah, dan supplier secara terintegrasi
          </p>
        </div>
        <Link
          href={tautanKelola}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 h-10 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <Settings2 className="h-4 w-4" />
          Kelola {daftarTab.find((t) => t.id === tab)?.label}
        </Link>
      </div>

      {/* Tab pemilih entitas */}
      <div className="flex flex-wrap gap-2">
        {daftarTab.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setCari("");
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              tab === t.id
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white border border-brand-100 text-slate-600 hover:bg-brand-50"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px]",
                tab === t.id ? "bg-white/20" : "bg-surface-sunken"
              )}
            >
              {t.jumlah}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ringkasan.map((r) => (
          <Card key={r.label}>
            <CardContent className="p-5 pt-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{r.label}</p>
                <p
                  title={r.nilai}
                  className="mt-1.5 text-xl sm:text-2xl font-extrabold text-slate-900 truncate"
                >
                  {r.nilai}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center",
                  r.warna
                )}
              >
                <r.icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              Daftar {daftarTab.find((t) => t.id === tab)?.label}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  aria-label="Cari data master"
                  placeholder="Cari nama..."
                  value={cari}
                  onChange={(e) => setCari(e.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <Link
                href={tautanKelola}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 shrink-0"
              >
                Kelola <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <TableSkeleton cols={4} />
          ) : tersaring.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Users className="h-11 w-11 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {cari ? "Data tidak ditemukan" : "Belum ada data"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-slate-500">
                    {tab === "member" && (
                      <>
                        <th className="py-2.5 pr-4 font-semibold">Kode</th>
                        <th className="py-2.5 px-4 font-semibold">Nama</th>
                        <th className="py-2.5 px-4 font-semibold">Telepon</th>
                        <th className="py-2.5 pl-4 font-semibold text-center">Poin</th>
                      </>
                    )}
                    {tab === "nasabah" && (
                      <>
                        <th className="py-2.5 pr-4 font-semibold">Nama</th>
                        <th className="py-2.5 px-4 font-semibold">Telepon</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Investasi</th>
                        <th className="py-2.5 pl-4 font-semibold text-center">Porsi</th>
                      </>
                    )}
                    {tab === "supplier" && (
                      <>
                        <th className="py-2.5 pr-4 font-semibold">Nama</th>
                        <th className="py-2.5 px-4 font-semibold">Telepon</th>
                        <th className="py-2.5 pl-4 font-semibold">Alamat</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(tersaring as any[]).slice(0, 8).map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      {tab === "member" && (
                        <>
                          <td className="py-3 pr-4 font-medium text-slate-900">{row.kode}</td>
                          <td className="py-3 px-4">{row.nama}</td>
                          <td className="py-3 px-4 text-slate-600">{row.telepon || "-"}</td>
                          <td className="py-3 pl-4 text-center">
                            <Badge variant="gold">{row.poin}</Badge>
                          </td>
                        </>
                      )}
                      {tab === "nasabah" && (
                        <>
                          <td className="py-3 pr-4 font-medium text-slate-900">{row.nama}</td>
                          <td className="py-3 px-4 text-slate-600">{row.telepon || "-"}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900">
                            {formatRupiah(row.jumlahInvestasi)}
                          </td>
                          <td className="py-3 pl-4 text-center">
                            <Badge>{row.persentase.toFixed(1)}%</Badge>
                          </td>
                        </>
                      )}
                      {tab === "supplier" && (
                        <>
                          <td className="py-3 pr-4 font-medium text-slate-900">{row.nama}</td>
                          <td className="py-3 px-4 text-slate-600">{row.telepon || "-"}</td>
                          <td className="py-3 pl-4 text-slate-600 max-w-[280px] truncate">
                            {row.alamat || "-"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {tersaring.length > 8 && (
                <p className="text-xs text-slate-400 pt-3">
                  Menampilkan 8 dari {tersaring.length} data —{" "}
                  <Link href={tautanKelola} className="text-brand-600 font-semibold">
                    lihat semua
                  </Link>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
