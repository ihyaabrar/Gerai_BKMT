"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2, FileText, Users, Store, ArrowRight, CheckCircle2,
  Circle, Clock, PenLine, Plus,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

interface Berita {
  id: string;
  judul: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tanggalPublikasi: string | null;
}

interface Pengurus {
  id: string;
  nama: string;
  jabatan: string;
  aktif: boolean;
  updatedAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [berita, setBerita] = useState<Berita[]>([]);
  const [pengurus, setPengurus] = useState<Pengurus[]>([]);
  const [profil, setProfil] = useState<any>(null);
  const [gerai, setGerai] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/berita").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/admin/pengurus").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/admin/profil").then((r) => r.json()).catch(() => ({ data: null })),
      fetch("/api/admin/gerai").then((r) => r.json()).catch(() => ({ data: null })),
    ])
      .then(([b, p, pr, g]) => {
        setBerita(b.data ?? []);
        setPengurus(p.data ?? []);
        setProfil(pr.data ?? null);
        setGerai(g.data ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const published = berita.filter((b) => b.status === "published");
  const draft = berita.filter((b) => b.status !== "published");
  const pengurusAktif = pengurus.filter((p) => p.aktif);

  const kartu = [
    {
      href: "/admin/berita",
      label: "Berita Terbit",
      nilai: published.length,
      sub: `${draft.length} masih draft`,
      icon: FileText,
      warna: "bg-brand-50 text-brand-600",
      latar: "bg-brand-50/50",
    },
    {
      href: "/admin/pengurus",
      label: "Pengurus Aktif",
      nilai: pengurusAktif.length,
      sub: `dari ${pengurus.length} terdaftar`,
      icon: Users,
      warna: "bg-sky-50 text-sky-600",
      latar: "bg-sky-50/40",
    },
    {
      href: "/admin/profil",
      label: "Profil Organisasi",
      nilai: profil ? "Lengkap" : "Kosong",
      sub: profil?.nama ?? "Belum diisi",
      icon: Building2,
      warna: "bg-gold-50 text-gold-600",
      latar: "bg-gold-50/40",
    },
    {
      href: "/admin/gerai",
      label: "Informasi Gerai",
      nilai: gerai ? "Lengkap" : "Kosong",
      sub: gerai?.nama ?? "Belum diisi",
      icon: Store,
      warna: "bg-violet-50 text-violet-600",
      latar: "bg-violet-50/40",
    },
  ];

  // Pertumbuhan berita 6 bulan terakhir, dihitung dari data yang ada.
  const pertumbuhan = useMemo(() => {
    const sekarang = new Date();
    const hasil: { bulan: string; jumlah: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1);
      const berikut = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const jumlah = berita.filter((b) => {
        const t = new Date(b.tanggalPublikasi ?? b.createdAt);
        return t >= d && t < berikut;
      }).length;
      hasil.push({ bulan: BULAN[d.getMonth()], jumlah });
    }
    return hasil;
  }, [berita]);

  const maksimal = Math.max(1, ...pertumbuhan.map((p) => p.jumlah));

  // Aktivitas terbaru dirangkai dari waktu ubah berita dan pengurus.
  const aktivitas = useMemo(() => {
    const semua = [
      ...berita.map((b) => ({
        waktu: b.updatedAt,
        judul: b.judul,
        jenis: b.status === "published" ? "Berita diterbitkan" : "Draft berita disimpan",
        icon: FileText,
        warna: "bg-brand-50 text-brand-600",
      })),
      ...pengurus.map((p) => ({
        waktu: p.updatedAt,
        judul: `${p.nama} — ${p.jabatan}`,
        jenis: "Data pengurus diperbarui",
        icon: Users,
        warna: "bg-sky-50 text-sky-600",
      })),
    ];
    return semua
      .sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime())
      .slice(0, 6);
  }, [berita, pengurus]);

  const kelengkapan = [
    { label: "Profil Organisasi", ok: !!profil, href: "/admin/profil" },
    { label: "Visi & Misi", ok: !!profil?.visi && !!profil?.misi, href: "/admin/profil" },
    { label: "Sejarah", ok: !!profil?.sejarah, href: "/admin/profil" },
    { label: "Berita & Pengumuman", ok: published.length > 0, href: "/admin/berita" },
    { label: "Pengurus", ok: pengurusAktif.length > 0, href: "/admin/pengurus" },
    { label: "Informasi Gerai", ok: !!gerai, href: "/admin/gerai" },
  ];
  const selesai = kelengkapan.filter((k) => k.ok).length;
  const persen = Math.round((selesai / kelengkapan.length) * 100);

  const aksiCepat = [
    { href: "/admin/berita/baru", label: "Tulis Berita", icon: PenLine },
    { href: "/admin/pengurus/baru", label: "Tambah Pengurus", icon: Plus },
    { href: "/admin/gerai", label: "Kelola Gerai", icon: Store },
    { href: "/admin/profil", label: "Ubah Profil", icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Sambutan */}
      <section className="relative overflow-hidden rounded-card border border-border bg-brand-hero px-6 py-7 sm:px-8">
        {/* Ilustrasi masjid — dekoratif, disembunyikan di layar sempit */}
        <img
          src="/images/masjid.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none hidden lg:block absolute right-4 -bottom-6 w-[320px] opacity-90 select-none"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-5 lg:pr-[320px]">
          <div className="max-w-xl">
            <p className="text-sm text-slate-500">Selamat datang,</p>
            <h1 className="mt-0.5 text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
              {user?.nama ?? "Admin"}!
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Mari terus berkontribusi untuk membangun masyarakat melalui dakwah,
              pendidikan, dan pemberdayaan umat.
            </p>
          </div>
          <blockquote className="rounded-xl border border-border bg-white/70 px-4 py-3 max-w-xs">
            <p className="font-display text-[15px] leading-snug text-slate-800">
              &ldquo;Majelis taklim kuat, masyarakat bermartabat.&rdquo;
            </p>
            <footer className="mt-1.5 text-xs text-slate-500">PD BKMT Kubu Raya</footer>
          </blockquote>
        </div>
      </section>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kartu.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={cn(
              "group rounded-card border border-border p-5 transition-colors hover:border-brand-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
              c.latar
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "inline-flex h-9 w-9 rounded-lg items-center justify-center",
                  c.warna
                )}
              >
                <c.icon className="h-[18px] w-[18px]" />
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </div>
            <p className="mt-3.5 text-[13px] font-medium text-slate-500">{c.label}</p>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1.5" />
            ) : (
              <p className="mt-1 text-[22px] font-bold text-slate-900 tracking-tight truncate">
                {c.nilai}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1 truncate">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pertumbuhan berita */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Pertumbuhan Berita</CardTitle>
              <span className="text-xs text-slate-500">6 bulan terakhir</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (
              <div className="flex items-end justify-between gap-3 h-40">
                {pertumbuhan.map((p) => (
                  <div key={p.bulan} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {p.jumlah || ""}
                    </span>
                    <div
                      className="w-full max-w-[36px] rounded-t-md bg-brand-500/85 transition-all"
                      style={{
                        height: `${Math.max(4, (p.jumlah / maksimal) * 110)}px`,
                      }}
                    />
                    <span className="text-[11px] text-slate-400">{p.bulan}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktivitas terbaru */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Clock className="h-[18px] w-[18px]" />
                </span>
                Aktivitas Terbaru
              </CardTitle>
              <Link
                href="/admin/berita"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Lihat semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : aktivitas.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                Belum ada aktivitas
              </p>
            ) : (
              <ul className="space-y-3.5">
                {aktivitas.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className={cn(
                        "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
                        a.warna
                      )}
                    >
                      <a.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {a.jenis}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {a.judul} ·{" "}
                        {new Date(a.waktu).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Kelengkapan konten */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Kelengkapan Konten Website</CardTitle>
              <Badge variant={persen === 100 ? "default" : "warning"}>
                {persen}% lengkap
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${persen}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2.5">
              {selesai} dari {kelengkapan.length} bagian utama telah diisi
            </p>

            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {kelengkapan.map((k) => (
                <li key={k.label}>
                  <Link
                    href={k.href}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700 transition-colors"
                  >
                    {k.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                    <span className="truncate">{k.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Aksi cepat */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {aksiCepat.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-brand-300 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  <span className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <a.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {a.label}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
