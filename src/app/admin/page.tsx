"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, FileText, Users, Store, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
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
      desc: "Edit nama, visi, misi, sejarah organisasi",
      status: stats.hasProfil ? "Sudah diisi" : "Belum diisi",
      ok: stats.hasProfil,
      color: "emerald",
    },
    {
      href: "/admin/berita",
      icon: FileText,
      label: "Berita & Pengumuman",
      desc: `${stats.berita} berita dipublikasikan`,
      status: `${stats.berita} published`,
      ok: stats.berita > 0,
      color: "blue",
    },
    {
      href: "/admin/pengurus",
      icon: Users,
      label: "Pengurus",
      desc: `${stats.pengurus} pengurus aktif`,
      status: `${stats.pengurus} aktif`,
      ok: stats.pengurus > 0,
      color: "violet",
    },
    {
      href: "/admin/gerai",
      icon: Store,
      label: "Informasi Gerai",
      desc: "Edit alamat, jam operasional, kontak",
      status: stats.hasGerai ? "Sudah diisi" : "Belum diisi",
      ok: stats.hasGerai,
      color: "amber",
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 mt-1">Kelola konten halaman profil publik BKMT Kubu Raya</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-emerald-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorMap[card.color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                {card.ok
                  ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                  : <AlertCircle className="h-5 w-5 text-amber-400" />
                }
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{card.label}</h3>
              <p className="text-gray-500 text-sm mb-3">{card.desc}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${card.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {card.status}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <p className="text-sm text-emerald-800">
          <strong>💡 Tips:</strong> Isi semua konten di atas agar halaman profil publik tampil lengkap.
          Kunjungi <Link href="/" className="underline font-medium" target="_blank">halaman publik</Link> untuk melihat hasilnya.
        </p>
      </div>
    </div>
  );
}
