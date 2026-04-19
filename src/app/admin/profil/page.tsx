"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Building2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function AdminProfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama: "", singkatan: "", deskripsi: "", visi: "", misi: "",
    sejarah: "", logoUrl: "", email: "", telepon: "", alamat: "",
    facebook: "", instagram: "", youtube: "", website: "",
  });

  useEffect(() => {
    fetch("/api/admin/profil").then((r) => r.json()).then((res) => {
      if (res.data) setForm({ ...form, ...res.data });
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) { toast.error("Nama organisasi tidak boleh kosong"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal menyimpan"); return; }
      toast.success("Profil berhasil disimpan");
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  const field = (label: string, key: keyof typeof form, type = "text", multiline = false) => (
    <div key={key}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {multiline ? (
        <textarea
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          rows={4}
          className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      ) : (
        <Input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1" />
      )}
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Memuat...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Organisasi</h1>
          <p className="text-gray-500 text-sm">Informasi identitas PD BKMT Kubu Raya</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {field("Nama Lengkap Organisasi *", "nama")}
          {field("Singkatan", "singkatan")}
        </div>
        {field("Deskripsi Singkat", "deskripsi", "text", true)}
        {field("Visi", "visi", "text", true)}
        {field("Misi", "misi", "text", true)}
        {field("Sejarah", "sejarah", "text", true)}

        <hr className="border-gray-200" />
        <p className="text-sm font-semibold text-gray-700">Kontak & Media Sosial</p>
        <div className="grid grid-cols-2 gap-4">
          {field("Email", "email", "email")}
          {field("Telepon", "telepon")}
          {field("Alamat", "alamat")}
          <div>
            <label className="text-sm font-medium text-gray-700">Logo Organisasi</label>
            <div className="mt-1">
              <ImageUpload
                value={form.logoUrl}
                onChange={(url) => setForm({ ...form, logoUrl: url })}
                folder="logo"
                label="Upload Logo"
                shape="circle"
                previewSize="md"
              />
            </div>
          </div>
          {field("Facebook", "facebook")}
          {field("Instagram", "instagram")}
          {field("YouTube", "youtube")}
          {field("Website", "website")}
        </div>

        <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Menyimpan..." : "Simpan Profil"}
        </Button>
      </form>
    </div>
  );
}
