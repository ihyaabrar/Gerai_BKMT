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
import { CEK_INTERNET } from "@/lib/pesan";
import { labelTautan, tautanSosial, type JenisSosial } from "@/lib/sosial";

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
  whatsapp: "",
  tiktok: "",
  slogan: "",
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
        if (!res.data) return;
        // Kolom kosong di database bernilai null; form butuh string supaya
        // .trim() dan isian tidak rusak.
        setForm((f) => {
          const baru = { ...f };
          for (const k of Object.keys(KOSONG) as (keyof typeof KOSONG)[]) {
            if (typeof res.data[k] === "string") baru[k] = res.data[k];
          }
          return baru;
        });
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
      toast.error("Profil belum tersimpan", { description: CEK_INTERNET });
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
        {bantuan && <p className="text-xs text-slate-500 mt-1.5">{bantuan}</p>}
      </div>
    );
  };

  // Kolom media sosial menampilkan tautan hasil tebakan, supaya pengurus
  // bisa memastikan isiannya benar sebelum menyimpan.
  const kolomSosial = (label: string, key: JenisSosial & keyof typeof form) => {
    const tautan = tautanSosial(key, form[key]);
    return kolom(label, key, {
      bantuan: !form[key].trim()
        ? "Kosong — tidak ditampilkan"
        : tautan
          ? `Membuka: ${labelTautan(tautan)}`
          : "Belum bisa dibaca sebagai tautan — periksa lagi isinya",
    });
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Profil Organisasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
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
          <CardContent className="space-y-5">
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
                  {kolom("Slogan", "slogan", {
                    bantuan: "Tampil di bagian atas dan bawah situs. Kosongkan untuk memakai \"Bersama Umat, Membangun Masyarakat\".",
                  })}
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
                <p className="text-sm text-slate-600 rounded-lg bg-surface-muted border border-border px-3.5 py-2.5 leading-relaxed">
                  Semua isian di bagian ini tampil di <strong>bagian paling bawah situs</strong>. Yang dikosongkan tidak ditampilkan.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {kolom("Email", "email", { type: "email" })}
                  {kolom("Telepon", "telepon")}
                  {kolom("WhatsApp", "whatsapp", {
                    bantuan: "Nomor HP, mis. 0812 3456 7890. Pengunjung bisa langsung mengirim pesan.",
                  })}
                </div>
                {kolom("Alamat Sekretariat", "alamat", { baris: 3 })}

                <div className="pt-1">
                  <p className="text-sm font-semibold text-slate-700">
                    Media Sosial
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 mb-3">
                    Boleh ditempel alamat lengkapnya, atau cukup nama akun seperti @bkmtkuburaya.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {kolomSosial("Facebook", "facebook")}
                    {kolomSosial("Instagram", "instagram")}
                    {kolomSosial("TikTok", "tiktok")}
                    {kolomSosial("YouTube", "youtube")}
                    {kolomSosial("Website", "website")}
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
