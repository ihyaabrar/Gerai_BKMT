"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, FileText, Users, Store, ArrowRight, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ berita: 0, pengurus: 0, hasProfil: false, hasGerai: false });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/berita").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/admin/pengurus").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/admin/profil").then((r) => r.json()).catch(() => ({ data: null })),
      fetch("/api/admin/gerai").then((r) => r.json()).catch(() => ({ data: null })),
    ]).then(([beritaRes, pengurusRes, profilRes, geraiRes]) => {
      setStats({
        berita: beritaRes.data?.filter((b: any) => b.status === "published").length || 0,
        pengurus: pengurusRes.data?.filter((p: any) => p.aktif).length || 0,
        hasProfil: !!profilRes.data,
        hasGerai: !!geraiRes.data,
      });
    });
  }, []);

  const cards = [
    {
      href: "/admin/profil",
      icon: Building2,
      label: "Profil Organisasi",
      desc: "Nama, visi, misi, sejarah, kontak",
      status: stats.hasProfil ? "Sudah diisi" : "Belum diisi",
      ok: stats.hasProfil,
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
    },
    {
      href: "/admin/berita",
      icon: FileText,
      label: "Berita & Pengumuman",
      desc: `${stats.berita} berita dipublikasikan`,
      status: `${stats.berita} published`,
      ok: stats.berita > 0,
      gradient: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50",
    },
    {
      href: "/admin/pengurus",
      icon: Users,
      label: "Pengurus",
      desc: `${stats.pengurus} pengurus aktif`,
      status: `${stats.pengurus} aktif`,
      ok: stats.pengurus > 0,
      gradient: "from-violet-500 to-purple-500",
      bg: "bg-violet-50",
    },
    {
      href: "/admin/gerai",
      icon: Store,
      label: "Informasi Gerai",
      desc: "Alamat, jam operasional, kontak",
      status: stats.hasGerai ? "Sudah diisi" : "Belum diisi",
      ok: stats.hasGerai,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
    },
  ];

  const completedCount = [stats.hasProfil, stats.berita > 0, stats.pengurus > 0, stats.hasGerai].filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">Selamat datang kembali,</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{user?.nama || "Admin"} 👋</h1>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          Lihat Halaman Publik
        </Link>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Kelengkapan Konten</p>
          <span className="text-sm font-bold text-emerald-600">{completedCount}/4 selesai</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 4) * 100}%` }}
          />
        </div>
        {completedCount < 4 && (
          <p className="text-xs text-gray-400 mt-2">
            Lengkapi semua konten agar halaman publik tampil sempurna
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all"
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-md`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {card.ok
                  ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                  : <AlertCircle className="h-5 w-5 text-amber-400" />
                }
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{card.label}</h3>
              <p className="text-gray-500 text-sm mb-4">{card.desc}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  card.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {card.status}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
