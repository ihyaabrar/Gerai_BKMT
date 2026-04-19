"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { generateSlug } from "@/lib/utils";

export default function BeritaBaruPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    judul: "", konten: "", ringkasan: "", gambarUrl: "", status: "draft",
  });
  const [slugPreview, setSlugPreview] = useState("");

  const handleJudulChange = (judul: string) => {
    setForm({ ...form, judul });
    setSlugPreview(generateSlug(judul));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul.trim()) { toast.error("Judul tidak boleh kosong"); return; }
    if (!form.konten.trim()) { toast.error("Konten tidak boleh kosong"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/berita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal menyimpan"); return; }
      toast.success("Berita berhasil dibuat");
      router.push("/admin/berita");
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/berita"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold text-gray-900">Buat Berita Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700">Judul *</label>
          <Input value={form.judul} onChange={(e) => handleJudulChange(e.target.value)} placeholder="Judul berita..." className="mt-1" />
          {slugPreview && <p className="text-xs text-gray-400 mt-1">Slug: /berita/{slugPreview}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Ringkasan</label>
          <textarea value={form.ringkasan} onChange={(e) => setForm({ ...form, ringkasan: e.target.value })}
            rows={2} placeholder="Ringkasan singkat berita..."
            className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Konten *</label>
          <textarea value={form.konten} onChange={(e) => setForm({ ...form, konten: e.target.value })}
            rows={10} placeholder="Isi berita lengkap..."
            className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">URL Gambar</label>
          <Input value={form.gambarUrl} onChange={(e) => setForm({ ...form, gambarUrl: e.target.value })} placeholder="https://..." className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />{saving ? "Menyimpan..." : "Simpan Berita"}
        </Button>
      </form>
    </div>
  );
}
