"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function PengurusBaruPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama: "", nik: "", alamat: "", jabatan: "", tingkatan: "PD",
    periode: "", fotoUrl: "", urutan: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) { toast.error("Nama tidak boleh kosong"); return; }
    if (!form.jabatan.trim()) { toast.error("Jabatan tidak boleh kosong"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pengurus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, urutan: parseInt(form.urutan) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal menyimpan"); return; }
      toast.success("Pengurus berhasil ditambahkan");
      router.push("/admin/pengurus");
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/pengurus"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Pengurus</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700">Nama Lengkap *</label>
            <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">NIK (Opsional)</label>
            <Input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Jabatan *</label>
            <Input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Tingkatan *</label>
            <select value={form.tingkatan} onChange={(e) => setForm({ ...form, tingkatan: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="PD">PD BKMT (Pimpinan Daerah)</option>
              <option value="PC">PC BKMT (Pimpinan Cabang)</option>
              <option value="Permata">Permata BKMT</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Periode</label>
            <Input value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })} placeholder="2023-2027" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Foto</label>
            <div className="mt-1">
              <ImageUpload
                value={form.fotoUrl}
                onChange={(url) => setForm({ ...form, fotoUrl: url })}
                folder="pengurus"
                label="Upload Foto"
                shape="circle"
                previewSize="sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Urutan Tampil</label>
            <Input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: e.target.value })} className="mt-1" />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700">Alamat</label>
            <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="mt-1" />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700">
          <Save className="h-4 w-4 mr-2" />{saving ? "Menyimpan..." : "Simpan Pengurus"}
        </Button>
      </form>
    </div>
  );
}
