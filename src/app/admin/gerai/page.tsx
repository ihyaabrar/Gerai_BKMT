"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Store } from "lucide-react";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function AdminGeraiPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama: "", alamat: "", jamOperasional: "", telepon: "", deskripsi: "",
  });

  useEffect(() => {
    fetch("/api/admin/gerai").then((r) => r.json()).then((res) => {
      if (res.data) setForm({ nama: res.data.nama || "", alamat: res.data.alamat || "", jamOperasional: res.data.jamOperasional || "", telepon: res.data.telepon || "", deskripsi: res.data.deskripsi || "" });
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) { toast.error("Nama gerai tidak boleh kosong"); return; }
    if (!form.alamat.trim()) { toast.error("Alamat tidak boleh kosong"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/gerai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal menyimpan"); return; }
      toast.success("Informasi gerai berhasil disimpan");
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Store className="h-7 w-7 text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Informasi Gerai</h1>
          <p className="text-slate-500 text-sm">Data operasional Gerai BKMT</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="nama-gerai">Nama Gerai *</label>
          <Input id="nama-gerai" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="alamat">Alamat *</label>
          <textarea id="alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} rows={3}
            className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="jam-operasional">Jam Operasional</label>
          <Input id="jam-operasional" value={form.jamOperasional} onChange={(e) => setForm({ ...form, jamOperasional: e.target.value })} placeholder="Senin-Jumat 08.00-17.00" className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="nomor-telepon">Nomor Telepon</label>
          <Input id="nomor-telepon" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} placeholder="08xx" className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="deskripsi-layanan">Deskripsi Layanan</label>
          <textarea id="deskripsi-layanan" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={4}
            className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <Button type="submit" disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700">
          <Save className="h-4 w-4 mr-2" />{saving ? "Menyimpan..." : "Simpan Informasi Gerai"}
        </Button>
      </form>
    </div>
  );
}
