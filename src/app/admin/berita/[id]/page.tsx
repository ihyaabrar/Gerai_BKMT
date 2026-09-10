"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function EditBeritaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    judul: "", konten: "", ringkasan: "", gambarUrl: "", status: "draft",
  });

  useEffect(() => {
    fetch(`/api/admin/berita/${params.id}`).then((r) => r.json()).then((res) => {
      if (res.data) setForm({ judul: res.data.judul, konten: res.data.konten, ringkasan: res.data.ringkasan || "", gambarUrl: res.data.gambarUrl || "", status: res.data.status });
    }).finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul.trim()) { toast.error("Judul tidak boleh kosong"); return; }
    if (!form.konten.trim()) { toast.error("Konten tidak boleh kosong"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/berita/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal menyimpan"); return; }
      toast.success("Berita berhasil diupdate");
      router.push("/admin/berita");
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  if (loading) return <PageSkeleton />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/admin/berita">
            <Button type="button" variant="ghost" size="icon" aria-label="Kembali">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Edit Berita
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Perbarui konten, lalu simpan sebagai draft atau terbitkan.
            </p>
          </div>
        </div>
        <Button type="submit" disabled={saving} className="shrink-0">
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      {/* Isi tulisan di kolom lebar, pengaturan terbit di kolom samping. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        <Card>
          <CardContent className="p-5 sm:p-6 pt-5 sm:pt-6 space-y-5">
            <div>
              <label htmlFor="judul" className="block text-sm font-medium text-slate-700">
                Judul <span className="text-red-500">*</span>
              </label>
              <Input
                id="judul"
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                className="mt-1.5 h-11 text-base"
              />
            </div>

            <div>
              <label htmlFor="ringkasan" className="block text-sm font-medium text-slate-700">
                Ringkasan
              </label>
              <textarea
                id="ringkasan"
                value={form.ringkasan}
                onChange={(e) => setForm({ ...form, ringkasan: e.target.value })}
                rows={3}
                className="mt-1.5 flex w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label htmlFor="konten" className="block text-sm font-medium text-slate-700">
                Konten <span className="text-red-500">*</span>
              </label>
              <textarea
                id="konten"
                value={form.konten}
                onChange={(e) => setForm({ ...form, konten: e.target.value })}
                rows={16}
                className="mt-1.5 flex w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                {form.konten.length} karakter
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:sticky lg:top-24">
          <Card>
            <CardContent className="p-5 pt-5 space-y-4">
              <p className="text-[15px] font-semibold text-slate-900">
                Pengaturan Terbit
              </p>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-white px-3.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="draft">Draft — belum tampil publik</option>
                  <option value="published">Dipublikasikan</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 pt-5 space-y-3">
              <p className="text-[15px] font-semibold text-slate-900">Gambar Berita</p>
              <ImageUpload
                value={form.gambarUrl}
                onChange={(url) => setForm({ ...form, gambarUrl: url })}
                folder="berita"
                label="Ganti Gambar"
                shape="square"
                previewSize="lg"
              />
              <p className="text-xs text-slate-400">JPG, PNG, WebP (maks. 5 MB)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
