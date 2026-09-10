"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { cn } from "@/lib/utils";
import {
  Save, Info, Target, BookOpen, Phone, CheckCircle2, Circle,
} from "lucide-react";
import { toast } from "sonner";

type Bagian = "umum" | "visimisi" | "sejarah" | "kontak";

const NAVIGASI: {
  id: Bagian;
  label: string;
  icon: typeof Info;
  deskripsi: string;
}[] = [
  {
    id: "umum",
    label: "Informasi Umum",
    icon: Info,
    deskripsi: "Nama, singkatan, deskripsi, dan logo organisasi",
  },
  {
    id: "visimisi",
    label: "Visi & Misi",
    icon: Target,
    deskripsi: "Arah dan komitmen organisasi",
  },
  {
    id: "sejarah",
    label: "Sejarah",
    icon: BookOpen,
    deskripsi: "Latar belakang dan perjalanan organisasi",
  },
  {
    id: "kontak",
    label: "Kontak & Media Sosial",
    icon: Phone,
    deskripsi: "Alamat, telepon, email, dan tautan sosial",
  },
];

const KOSONG = {
  nama: "",
  singkatan: "",
  deskripsi: "",
  visi: "",
  misi: "",
  sejarah: "",
  logoUrl: "",
  email: "",
  telepon: "",
  alamat: "",
  facebook: "",
  instagram: "",
  youtube: "",
  website: "",
};

export default function AdminProfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bagian, setBagian] = useState<Bagian>("umum");
  const [form, setForm] = useState(KOSONG);

  useEffect(() => {
    fetch("/api/admin/profil")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => {
        if (res.data) setForm((f) => ({ ...f, ...res.data }));
      })
      .catch(() => toast.error("Gagal memuat profil"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      toast.error("Nama organisasi tidak boleh kosong");
      setBagian("umum");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan");
        return;
      }
      toast.success("Perubahan profil disimpan");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const ubah = (key: keyof typeof form) => (nilai: string) =>
    setForm((f) => ({ ...f, [key]: nilai }));

  const kolom = (
    label: string,
    key: keyof typeof form,
    opsi: { type?: string; baris?: number; bantuan?: string; wajib?: boolean } = {}
  ) => {
    const id = `profil-${String(key)}`;
    const { type = "text", baris, bantuan, wajib } = opsi;
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {wajib && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {baris ? (
          <textarea
            id={id}
            rows={baris}
            value={form[key]}
            onChange={(e) => ubah(key)(e.target.value)}
            className="mt-1.5 flex w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        ) : (
          <Input
            id={id}
            type={type}
            value={form[key]}
            onChange={(e) => ubah(key)(e.target.value)}
            className="mt-1.5"
          />
        )}
        {bantuan && <p className="text-xs text-slate-400 mt-1.5">{bantuan}</p>}
      </div>
    );
  };

  // Penanda bagian yang sudah terisi, supaya admin tahu apa yang tersisa.
  const terisi: Record<Bagian, boolean> = {
    umum: !!form.nama.trim() && !!form.deskripsi.trim(),
    visimisi: !!form.visi.trim() && !!form.misi.trim(),
    sejarah: !!form.sejarah.trim(),
    kontak: !!form.alamat.trim() || !!form.email.trim() || !!form.telepon.trim(),
  };

  if (loading) return <PageSkeleton />;

  const aktif = NAVIGASI.find((n) => n.id === bagian)!;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Profil Organisasi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola informasi, sejarah, visi-misi, dan kontak organisasi.
          </p>
        </div>
        <Button type="submit" disabled={saving} className="shrink-0">
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
        {/* Sub-navigasi bagian */}
        <nav aria-label="Bagian profil" className="lg:sticky lg:top-24">
          <ul className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {NAVIGASI.map((n) => {
              const dipilih = bagian === n.id;
              return (
                <li key={n.id} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => setBagian(n.id)}
                    aria-current={dipilih ? "true" : undefined}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors text-left",
                      dipilih
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-surface-sunken hover:text-slate-900"
                    )}
                  >
                    <n.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{n.label}</span>
                    {terisi[n.id] ? (
                      <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-brand-500 shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 ml-auto text-slate-300 shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Isi bagian terpilih */}
        <Card>
          <CardContent className="p-5 sm:p-6 pt-5 sm:pt-6 space-y-5">
            <div className="pb-1">
              <h2 className="text-[15px] font-semibold text-slate-900">
                {aktif.label}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{aktif.deskripsi}</p>
            </div>

            {bagian === "umum" && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {kolom("Nama Organisasi", "nama", { wajib: true })}
                    {kolom("Singkatan", "singkatan", {
                      bantuan: "Dipakai sebagai judul besar di halaman publik",
                    })}
                  </div>
                  {kolom("Deskripsi Singkat", "deskripsi", {
                    baris: 5,
                    bantuan: `${form.deskripsi.length} karakter`,
                  })}
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1.5">
                    Logo Organisasi
                  </p>
                  <ImageUpload
                    value={form.logoUrl}
                    onChange={ubah("logoUrl")}
                    folder="logo"
                    label="Pilih Logo"
                    shape="circle"
                    previewSize="md"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Format PNG, JPG (maks. 5 MB)
                  </p>
                </div>
              </div>
            )}

            {bagian === "visimisi" && (
              <div className="space-y-5">
                {kolom("Visi", "visi", {
                  baris: 4,
                  bantuan: "Satu kalimat arah jangka panjang organisasi",
                })}
                {kolom("Misi", "misi", {
                  baris: 7,
                  bantuan:
                    "Tulis satu misi per baris — pemisah baris ikut tampil di halaman publik",
                })}
              </div>
            )}

            {bagian === "sejarah" && (
              <div className="space-y-5">
                {kolom("Sejarah Organisasi", "sejarah", {
                  baris: 12,
                  bantuan: `${form.sejarah.length} karakter · pemisah baris ikut tampil di halaman publik`,
                })}
              </div>
            )}

            {bagian === "kontak" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {kolom("Email", "email", { type: "email" })}
                  {kolom("Telepon", "telepon")}
                </div>
                {kolom("Alamat Sekretariat", "alamat", { baris: 3 })}

                <div className="pt-1">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Media Sosial
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {kolom("Facebook", "facebook")}
                    {kolom("Instagram", "instagram")}
                    {kolom("YouTube", "youtube")}
                    {kolom("Website", "website")}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
