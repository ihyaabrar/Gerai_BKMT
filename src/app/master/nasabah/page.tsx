"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Users, Search, Edit, Trash2, TrendingUp } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";

interface Nasabah {
  id: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  jumlahInvestasi: number;
  persentase: number;
  aktif: boolean;
}

export default function NasabahPage() {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([]);
  const [totalLabaBulanIni, setTotalLabaBulanIni] = useState(0);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nama: "", telepon: "", alamat: "", jumlahInvestasi: "" });

  useEffect(() => {
    fetchNasabah();
    fetchLaba();
  }, []);

  const fetchNasabah = async () => {
    const res = await fetch("/api/nasabah");
    const data = await res.json();
    setNasabahList(data);
  };

  const fetchLaba = async () => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = now.toISOString();
      const res = await fetch(`/api/laporan?type=penjualan&startDate=${start}&endDate=${end}`);
      const data = await res.json();
      setTotalLabaBulanIni(data.totalLaba || 0);
    } catch {
      // ignore
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ nama: "", telepon: "", alamat: "", jumlahInvestasi: "" });
    setShowForm(true);
  };

  const openEdit = (n: Nasabah) => {
    setEditId(n.id);
    setForm({
      nama: n.nama,
      telepon: n.telepon || "",
      alamat: n.alamat || "",
      jumlahInvestasi: String(n.jumlahInvestasi),
    });
    setShowForm(true);
  };

  const totalInvestasi = nasabahList.reduce((sum, n) => sum + n.jumlahInvestasi, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const jumlahInvestasi = parseFloat(form.jumlahInvestasi);
      let res: Response;

      if (editId) {
        res = await fetch("/api/nasabah", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...form, jumlahInvestasi }),
        });
      } else {
        res = await fetch("/api/nasabah", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, jumlahInvestasi }),
        });
      }

      if (!res.ok) throw new Error();
      toast.success(editId ? "Nasabah berhasil diupdate" : "Nasabah berhasil ditambahkan");
      setShowForm(false);
      fetchNasabah();
    } catch {
      toast.error("Gagal menyimpan nasabah");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus nasabah "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/nasabah?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Nasabah berhasil dihapus");
      fetchNasabah();
    } catch {
      toast.error("Gagal menghapus nasabah");
    }
  };

  const filtered = nasabahList.filter(
    (n) =>
      n.nama.toLowerCase().includes(search.toLowerCase()) ||
      (n.telepon || "").includes(search)
  );

  const bagianNasabahTotal = totalLabaBulanIni * 0.3;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nasabah / Investor</h1>
          <p className="text-gray-500">Data investor dan kepemilikan</p>
        </div>
        <Button onClick={openAdd}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah Nasabah
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Investasi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600">{formatRupiah(totalInvestasi)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Laba Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalLabaBulanIni)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Bagian Nasabah (30%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatRupiah(bagianNasabahTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Nasabah
            </CardTitle>
            <div className="relative w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nasabah..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{search ? "Nasabah tidak ditemukan" : "Belum ada nasabah"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nama</th>
                    <th className="text-left py-3 px-4">Telepon</th>
                    <th className="text-right py-3 px-4">Investasi</th>
                    <th className="text-center py-3 px-4">Porsi</th>
                    <th className="text-right py-3 px-4">Bagi Hasil Bulan Ini</th>
                    <th className="text-center py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((n) => {
                    const porsi = totalInvestasi > 0 ? (n.jumlahInvestasi / totalInvestasi) * 100 : 0;
                    const bagiHasil = bagianNasabahTotal * (porsi / 100);
                    return (
                      <tr key={n.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{n.nama}</p>
                          <p className="text-xs text-gray-400">{n.alamat || "-"}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{n.telepon || "-"}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatRupiah(n.jumlahInvestasi)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-1 bg-violet-100 text-violet-800 rounded-full text-xs font-medium">
                            {porsi.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                          {formatRupiah(bagiHasil)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(n)}>
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(n.id, n.nama)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md" onClose={() => setShowForm(false)}>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Nasabah" : "Tambah Nasabah Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Lengkap</label>
              <Input required value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama nasabah" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Telepon</label>
              <Input value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                placeholder="08xx" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Alamat</label>
              <Input value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Alamat lengkap" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah Investasi</label>
              <Input required type="number" min="1" value={form.jumlahInvestasi}
                onChange={(e) => setForm({ ...form, jumlahInvestasi: e.target.value })}
                placeholder="0" className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : editId ? "Update Nasabah" : "Simpan Nasabah"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
