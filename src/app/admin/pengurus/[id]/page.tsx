"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CEK_INTERNET } from "@/lib/pesan";
import { LABEL_JENJANG, jenjangJabatan } from "@/lib/struktur-pengurus";
import { KECAMATAN_KUBU_RAYA } from "@/lib/wilayah";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function EditPengurusPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama: "", nik: "", alamat: "", jabatan: "", tingkatan: "PD", wilayah: "",
    periode: "", fotoUrl: "", urutan: "0", aktif: true,
  });

  useEffect(() => {
    fetch(`/api/admin/pengurus/${params.id}`).then((r) => r.json()).then((res) => {
      if (res.data) setForm({ ...res.data, urutan: String(res.data.urutan ?? 0), nik: res.data.nik || "", alamat: res.data.alamat || "", wilayah: res.data.wilayah || "", periode: res.data.periode || "", fotoUrl: res.data.fotoUrl || "" });
    }).finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) { toast.error("Nama tidak boleh kosong"); return; }
    if (!form.jabatan.trim()) { toast.error("Jabatan tidak boleh kosong"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pengurus/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, urutan: parseInt(form.urutan) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal menyimpan"); return; }
      toast.success("Pengurus berhasil diperbarui");
      router.push("/admin/pengurus");
    } catch { toast.error("Perubahan belum tersimpan", { description: CEK_INTERNET }); }
    finally { setSaving(false); }
  };

  if (loading) return <PageSkeleton />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/admin/pengurus">
            <Button type="button" variant="ghost" size="icon" aria-label="Kembali">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Edit Pengurus
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Data pengurus tampil pada halaman susunan pengurus di website publik.
            </p>
          </div>
        </div>
        <Button type="submit" disabled={saving} className="shrink-0">
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      {/*
        Dua kolom: data teks di kolom lebar, foto di kolom samping.
        Sebelumnya seluruh kolom menumpuk dalam satu lajur sempit sehingga
        halaman terasa memanjang dan sisi kanan layar terbuang.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        <Card>
          <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="nama-lengkap">Nama Lengkap *</label>
            <Input id="nama-lengkap" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="jabatan">Jabatan *</label>
            <Input id="jabatan" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} className="mt-1" />
            {form.jabatan.trim() && (
              <p className="text-xs text-slate-500 mt-1.5">
                Tampil di bagan sebagai: <strong>{LABEL_JENJANG[jenjangJabatan(form.jabatan)]}</strong>
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="tingkatan">Tingkatan</label>
            <select id="tingkatan" value={form.tingkatan} onChange={(e) => setForm({ ...form, tingkatan: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/25">
              <option value="PD">PD BKMT</option>
              <option value="PC">PC BKMT</option>
              <option value="Permata">Permata BKMT</option>
            </select>
          </div>
          {form.tingkatan !== "PD" && (
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="wilayah">Cabang / Wilayah</label>
              <Input id="wilayah" list="daftar-kecamatan" value={form.wilayah} onChange={(e) => setForm({ ...form, wilayah: e.target.value })} placeholder="mis. Sungai Raya" className="mt-1" />
              <datalist id="daftar-kecamatan">
                {KECAMATAN_KUBU_RAYA.map((k) => <option key={k} value={k} />)}
              </datalist>
              <p className="text-xs text-slate-500 mt-1.5">Pilih kecamatan, atau ketik nama kelurahan/desa. Di situs, pengurus dikelompokkan per cabang.</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="periode">Periode</label>
            <Input id="periode" value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="urutan">Urutan</label>
            <Input id="urutan" type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: e.target.value })} className="mt-1" />
          </div>
          <details className="sm:col-span-2 rounded-lg border border-border bg-surface-muted/60 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Data pribadi <span className="font-normal text-slate-500">— tidak wajib, tidak tampil di situs{form.nik || form.alamat ? " · sudah diisi" : ""}</span>
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="nik">NIK</label>
                <Input id="nik" inputMode="numeric" maxLength={16} value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, "") })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="alamat">Alamat</label>
                <Input id="alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="mt-1" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Hanya terlihat oleh admin. Kosongkan bila tidak diperlukan.</p>
          </details>
        </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-24">
          <CardContent className="space-y-3">
            <p className="text-[15px] font-semibold text-slate-900">Foto Pengurus</p>
            <ImageUpload
              value={form.fotoUrl}
              onChange={(url) => setForm({ ...form, fotoUrl: url })}
              folder="pengurus"
              label="Ganti Foto"
              shape="circle"
              previewSize="md"
            />
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
