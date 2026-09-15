"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Save, Send } from "lucide-react";

type Status = "draft" | "published";

const PILIHAN: { nilai: Status; judul: string; isi: string }[] = [
  { nilai: "draft", judul: "Simpan dulu (draf)", isi: "Belum terlihat pengunjung situs." },
  { nilai: "published", judul: "Terbitkan", isi: "Langsung tampil di situs." },
];

/** Dua pilihan besar pengganti kotak pilih "Draft / Dipublikasikan". */
export function PilihanTerbit({
  status,
  onUbah,
}: {
  status: string;
  onUbah: (status: Status) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[15px] font-semibold text-slate-900">Tampilkan di situs?</legend>
      <div className="mt-3 space-y-2">
        {PILIHAN.map((p) => (
          <label
            key={p.nilai}
            className={cn(
              "flex gap-3 rounded-lg border px-3.5 py-3 cursor-pointer transition-colors",
              status === p.nilai
                ? "border-brand-500 bg-brand-50/60"
                : "border-border hover:bg-surface-muted"
            )}
          >
            <input
              type="radio"
              name="status-terbit"
              value={p.nilai}
              checked={status === p.nilai}
              onChange={() => onUbah(p.nilai)}
              className="mt-1 h-4 w-4 accent-brand-600"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">{p.judul}</span>
              <span className="block text-xs text-slate-500 mt-0.5">{p.isi}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function labelSimpanBerita(status: string, saving: boolean) {
  if (saving) return "Menyimpan...";
  return status === "published" ? "Simpan & Terbitkan" : "Simpan Draf";
}

/**
 * Tombol simpan di bawah form. Di HP menempel di bawah layar supaya tidak
 * perlu menggulung kembali ke atas setelah menulis berita panjang.
 */
export function BarSimpanBerita({ status, saving }: { status: string; saving: boolean }) {
  const Ikon = status === "published" ? Send : Save;
  return (
    <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 lg:mx-0 border-t border-border bg-white/95 backdrop-blur px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-end gap-2 lg:static lg:border-0 lg:bg-transparent lg:p-0">
      <Link href="/admin/berita" className="lg:mr-auto">
        <Button type="button" variant="outline">Batal</Button>
      </Link>
      <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
        <Ikon className="h-4 w-4" />
        {labelSimpanBerita(status, saving)}
      </Button>
    </div>
  );
}
