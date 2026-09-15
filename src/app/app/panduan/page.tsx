"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { isAdminRole } from "@/lib/permissions";
import { PANDUAN, type Panduan } from "@/lib/panduan";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

function KartuPanduan({ p, terbuka, onToggle }: { p: Panduan; terbuka: boolean; onToggle: () => void }) {
  return (
    <section id={p.id} className="scroll-mt-20 rounded-card border border-border bg-white">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={terbuka}
          className="w-full flex items-start gap-3 text-left px-4 sm:px-5 py-4"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-slate-900">{p.judul}</span>
            <span className="block text-sm text-slate-500 mt-0.5">{p.kapan}</span>
          </span>
          <ChevronDown
            className={cn("h-5 w-5 text-slate-400 shrink-0 mt-0.5 transition-transform", terbuka && "rotate-180")}
          />
        </button>
      </h3>

      {terbuka && (
        <div className="px-4 sm:px-5 pb-5 space-y-4">
          <ol className="space-y-3">
            {p.langkah.map((l, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 h-7 w-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed text-slate-700 pt-0.5">{l}</span>
              </li>
            ))}
          </ol>

          {p.perhatian && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4" /> Perhatikan
              </p>
              <ul className="mt-1.5 space-y-1.5 list-disc pl-5 text-sm text-amber-900 leading-relaxed">
                {p.perhatian.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {p.tautan && (
            <Link
              href={p.tautan.href}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              {p.tautan.label} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default function PanduanPage() {
  const { user } = useAuthStore();
  const pengurus = isAdminRole(user?.role);
  const [cari, setCari] = useState("");
  const [terbuka, setTerbuka] = useState<string | null>(null);

  const q = cari.trim().toLowerCase();
  const cocok = (p: Panduan) =>
    !q ||
    [p.judul, p.kapan, ...p.langkah, ...(p.perhatian ?? [])].some((t) => t.toLowerCase().includes(q));

  const kelompok = [
    { judul: "Pekerjaan sehari-hari", daftar: PANDUAN.filter((p) => p.pembaca === "semua" && cocok(p)) },
    ...(pengurus
      ? [{ judul: "Khusus pengurus", daftar: PANDUAN.filter((p) => p.pembaca === "pengurus" && cocok(p)) }]
      : []),
  ];
  const kosong = kelompok.every((k) => k.daftar.length === 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Cara Pakai</h1>
        <p className="text-slate-500 mt-1">
          Ketuk judul untuk melihat langkahnya. Tidak perlu dihafal — buka lagi kapan saja.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          aria-label="Cari panduan"
          placeholder="Cari, mis. struk, tutup kasir, nasabah"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {kosong && (
        <p className="text-center text-slate-500 py-8">
          Tidak ada panduan yang cocok. Coba kata lain, atau tanyakan ke pengurus.
        </p>
      )}

      {kelompok.map(
        (k) =>
          k.daftar.length > 0 && (
            <div key={k.judul} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{k.judul}</h2>
              {k.daftar.map((p) => (
                <KartuPanduan
                  key={p.id}
                  p={p}
                  // Saat mencari, semua hasil langsung terbuka.
                  terbuka={Boolean(q) || terbuka === p.id}
                  onToggle={() => setTerbuka((t) => (t === p.id ? null : p.id))}
                />
              ))}
            </div>
          )
      )}
    </div>
  );
}
