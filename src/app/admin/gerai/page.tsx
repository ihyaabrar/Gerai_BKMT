"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Informasi Gerai
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Data operasional Gerai BKMT yang tampil di halaman publik.
          </p>
        </div>
        <Button type="submit" disabled={saving} className="shrink-0">
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6 pt-5 sm:pt-6 grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5">
        <div className="lg:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="nama-gerai">Nama Gerai *</label>
          <Input id="nama-gerai" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="alamat">Alamat *</label>
          <textarea id="alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} rows={3}
            className="mt-1 flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-brand-500 focus:ring-brand-500/20" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="jam-operasional">Jam Operasional</label>
          <Input id="jam-operasional" value={form.jamOperasional} onChange={(e) => setForm({ ...form, jamOperasional: e.target.value })} placeholder="Senin-Jumat 08.00-17.00" className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="nomor-telepon">Nomor Telepon</label>
          <Input id="nomor-telepon" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} placeholder="08xx" className="mt-1" />
        </div>
        <div className="lg:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="deskripsi-layanan">Deskripsi Layanan</label>
          <textarea id="deskripsi-layanan" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={4}
            className="mt-1 flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-brand-500 focus:ring-brand-500/20" />
        </div>
        </CardContent>
      </Card>
    </form>
  );
}
