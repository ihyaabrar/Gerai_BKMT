"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save, Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

interface KategoriItem {
  id: string;
  nama: string;
}

export default function PengaturanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    namaToko: "Gerai BKMT",
    alamatToko: "",
    teleponToko: "",
    prefixTransaksi: "TRX",
    diskonMember: "5",
    persenNasabah: "30",
    persenPengelola: "70",
  });

  // Kategori Barang
  const [kategoriBarang, setKategoriBarang] = useState<KategoriItem[]>([]);
  const [newKategoriBarang, setNewKategoriBarang] = useState("");
  const [addingKB, setAddingKB] = useState(false);

  // Kategori Pengeluaran
  const [kategoriPengeluaran, setKategoriPengeluaran] = useState<KategoriItem[]>([]);
  const [newKategoriPengeluaran, setNewKategoriPengeluaran] = useState("");
  const [addingKP, setAddingKP] = useState(false);

  useEffect(() => {
    fetchPengaturan();
    fetchKategoriBarang();
    fetchKategoriPengeluaran();
  }, []);

  const fetchPengaturan = async () => {
    try {
      const res = await fetch("/api/pengaturan");
      const data = await res.json();
      setForm({
        namaToko: data.namaToko || "Gerai BKMT",
        alamatToko: data.alamatToko || "",
        teleponToko: data.teleponToko || "",
        prefixTransaksi: data.prefixTransaksi || "TRX",
        diskonMember: String(data.diskonMember ?? 5),
        persenNasabah: String(data.persenNasabah ?? 30),
        persenPengelola: String(data.persenPengelola ?? 70),
      });
    } catch {
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const fetchKategoriBarang = async () => {
    try {
      const res = await fetch("/api/kategori-barang");
      const data = await res.json();
      setKategoriBarang(data);
    } catch { /* ignore */ }
  };

  const fetchKategoriPengeluaran = async () => {
    try {
      const res = await fetch("/api/kategori-pengeluaran");
      const data = await res.json();
      setKategoriPengeluaran(data);
    } catch { /* ignore */ }
  };

  const handleChange = (field: string, value: string) => {
    if (field === "persenNasabah") {
      const n = parseFloat(value) || 0;
      setForm((f) => ({ ...f, persenNasabah: value, persenPengelola: String(100 - n) }));
      return;
    }
    if (field === "persenPengelola") {
      const p = parseFloat(value) || 0;
      setForm((f) => ({ ...f, persenPengelola: value, persenNasabah: String(100 - p) }));
      return;
    }
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(form.persenNasabah);
    const p = parseFloat(form.persenPengelola);
    if (n + p !== 100) {
      toast.error("Persentase nasabah + pengelola harus 100%");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaToko: form.namaToko,
          alamatToko: form.alamatToko,
          teleponToko: form.teleponToko,
          prefixTransaksi: form.prefixTransaksi,
          diskonMember: parseFloat(form.diskonMember),
          persenNasabah: n,
          persenPengelola: p,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pengaturan berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const handleAddKategoriBarang = async () => {
    if (!newKategoriBarang.trim()) return;
    setAddingKB(true);
    try {
      const res = await fetch("/api/kategori-barang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: newKategoriBarang.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menambah kategori");
        return;
      }
      toast.success("Kategori barang ditambahkan");
      setNewKategoriBarang("");
      fetchKategoriBarang();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setAddingKB(false);
    }
  };

  const handleDeleteKategoriBarang = async (id: string, nama: string) => {
    if (!confirm(`Hapus kategori "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/kategori-barang?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Kategori dihapus");
        fetchKategoriBarang();
      }
    } catch {
      toast.error("Gagal menghapus kategori");
    }
  };

  const handleAddKategoriPengeluaran = async () => {
    if (!newKategoriPengeluaran.trim()) return;
    setAddingKP(true);
    try {
      const res = await fetch("/api/kategori-pengeluaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: newKategoriPengeluaran.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menambah kategori");
        return;
      }
      toast.success("Kategori pengeluaran ditambahkan");
      setNewKategoriPengeluaran("");
      fetchKategoriPengeluaran();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setAddingKP(false);
    }
  };

  const handleDeleteKategoriPengeluaran = async (id: string, nama: string) => {
    if (!confirm(`Hapus kategori "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/kategori-pengeluaran?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Kategori dihapus");
        fetchKategoriPengeluaran();
      }
    } catch {
      toast.error("Gagal menghapus kategori");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const totalPersen = parseFloat(form.persenNasabah || "0") + parseFloat(form.persenPengelola || "0");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-gray-500">Konfigurasi sistem</p>
      </div>

      {/* Pengaturan Toko */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pengaturan Toko
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Toko</label>
              <Input required value={form.namaToko}
                onChange={(e) => handleChange("namaToko", e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Alamat Toko</label>
              <Input value={form.alamatToko}
                onChange={(e) => handleChange("alamatToko", e.target.value)}
                placeholder="Alamat lengkap" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Telepon Toko</label>
              <Input value={form.teleponToko}
                onChange={(e) => handleChange("teleponToko", e.target.value)}
                placeholder="08xx" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Prefix Nomor Transaksi</label>
              <Input required value={form.prefixTransaksi}
                onChange={(e) => handleChange("prefixTransaksi", e.target.value)}
                placeholder="TRX" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Diskon Member (%)</label>
              <Input required type="number" min="0" max="100" value={form.diskonMember}
                onChange={(e) => handleChange("diskonMember", e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Persentase Nasabah (%)</label>
                <Input required type="number" min="0" max="100" value={form.persenNasabah}
                  onChange={(e) => handleChange("persenNasabah", e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Persentase Pengelola (%)</label>
                <Input required type="number" min="0" max="100" value={form.persenPengelola}
                  onChange={(e) => handleChange("persenPengelola", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className={`p-3 rounded-lg text-sm font-medium ${
              totalPersen === 100
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              Total persentase: {totalPersen}% {totalPersen === 100 ? "✓" : "(harus 100%)"}
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg" disabled={saving || totalPersen !== 100}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Kategori Barang */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            Kategori Barang
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newKategoriBarang}
              onChange={(e) => setNewKategoriBarang(e.target.value)}
              placeholder="Nama kategori baru (misal: Makanan)"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKategoriBarang())}
            />
            <Button
              onClick={handleAddKategoriBarang}
              disabled={addingKB || !newKategoriBarang.trim()}
              className="bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah
            </Button>
          </div>
          {kategoriBarang.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada kategori barang</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {kategoriBarang.map((k) => (
                <div key={k.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-800">
                  <span>{k.nama}</span>
                  <button
                    onClick={() => handleDeleteKategoriBarang(k.id, k.nama)}
                    className="ml-1 text-blue-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kategori Pengeluaran */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-orange-600" />
            Kategori Pengeluaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newKategoriPengeluaran}
              onChange={(e) => setNewKategoriPengeluaran(e.target.value)}
              placeholder="Nama kategori baru (misal: Gaji)"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKategoriPengeluaran())}
            />
            <Button
              onClick={handleAddKategoriPengeluaran}
              disabled={addingKP || !newKategoriPengeluaran.trim()}
              className="bg-orange-600 hover:bg-orange-700 shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah
            </Button>
          </div>
          {kategoriPengeluaran.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada kategori pengeluaran</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {kategoriPengeluaran.map((k) => (
                <div key={k.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-sm text-orange-800">
                  <span>{k.nama}</span>
                  <button
                    onClick={() => handleDeleteKategoriPengeluaran(k.id, k.nama)}
                    className="ml-1 text-orange-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
