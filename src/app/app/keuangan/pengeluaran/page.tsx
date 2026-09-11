"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Plus, Trash2, Calendar, Search, Download } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { Pagination } from "@/components/ui/pagination";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { TableSkeleton } from "@/components/ui/skeleton";

interface Pengeluaran {
  id: string;
  tanggal: string;
  kategori: string;
  keterangan: string;
  jumlah: number;
}

interface KategoriPengeluaran {
  id: string;
  nama: string;
}

export default function PengeluaranPage() {
  const { konfirmasi, dialog } = useConfirm();
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [filteredData, setFilteredData] = useState<Pengeluaran[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriPengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [form, setForm] = useState({
    tanggal: format(new Date(), "yyyy-MM-dd"),
    kategori: "",
    keterangan: "",
    jumlah: "",
  });

  const fetchKategori = async () => {
    try {
      const res = await fetch("/api/kategori-pengeluaran");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setKategoriList(data);
      if (data.length > 0) {
        setForm((f) => ({ ...f, kategori: f.kategori || data[0].nama }));
      }
    } catch {
      // ignore
    }
  };

  const fetchPengeluaran = async () => {
    try {
      const res = await fetch("/api/pengeluaran");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      setPengeluaran(rows);
      setFilteredData(rows);
    } catch {
      toast.error("Gagal memuat data pengeluaran");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengeluaran();
    fetchKategori();
  }, []);

  useEffect(() => {
    const filtered = pengeluaran.filter(
      (p) =>
        p.kategori.toLowerCase().includes(search.toLowerCase()) ||
        p.keterangan.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [search, pengeluaran]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kategori) {
      toast.error("Pilih kategori pengeluaran");
      return;
    }
    try {
      const res = await fetch("/api/pengeluaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Pengeluaran berhasil dicatat");
        setOpen(false);
        setForm({
          tanggal: format(new Date(), "yyyy-MM-dd"),
          kategori: kategoriList[0]?.nama || "",
          keterangan: "",
          jumlah: "",
        });
        fetchPengeluaran();
      } else {
        toast.error("Gagal menyimpan pengeluaran");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDelete = (id: string, keterangan: string) => {
    konfirmasi({
      judul: "Hapus pengeluaran?",
      pesan: <>Catatan <strong>{keterangan}</strong> akan dihapus permanen.</>,
      aksi: async () => {
        try {
          const res = await fetch(`/api/pengeluaran?id=${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("Pengeluaran dihapus");
            fetchPengeluaran();
          } else {
            const data = await res.json().catch(() => null);
            toast.error(data?.error || "Gagal menghapus");
          }
        } catch {
          toast.error("Gagal menghapus");
        }
      },
    });
  };

  const totalPengeluaran = filteredData.reduce((sum, p) => sum + p.jumlah, 0);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const exportData = filteredData.map((p) => ({
      Tanggal: format(new Date(p.tanggal), "dd/MM/yyyy"),
      Kategori: p.kategori,
      Keterangan: p.keterangan,
      Jumlah: p.jumlah,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran");
    ws["!cols"] = [{ wch: 12 }, { wch: 15 }, { wch: 40 }, { wch: 15 }];
    XLSX.writeFile(wb, `Pengeluaran_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Pengeluaran</h1>
          <p className="text-slate-500">Catat pengeluaran operasional</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pengeluaran
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Pengeluaran</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium" htmlFor="tanggal">Tanggal</label>
                  <Input id="tanggal"
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="kategori">Kategori</label>
                  <select id="kategori"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    required
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {kategoriList.map((k) => (
                      <option key={k.id} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                  {kategoriList.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Belum ada kategori. Tambahkan di menu Pengaturan.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="keterangan">Keterangan</label>
                  <Input id="keterangan"
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                    placeholder="Deskripsi pengeluaran"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="jumlah">Jumlah</label>
                  <Input id="jumlah"
                    type="number"
                    value={form.jumlah}
                    onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                  Simpan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-red-500 to-orange-600 text-white">
        <CardHeader>
          <CardTitle className="text-white">Total Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{formatRupiah(totalPengeluaran)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Riwayat Pengeluaran
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input aria-label="Cari pengeluaran..."
                placeholder="Cari pengeluaran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton cols={5} />
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {search ? "Tidak ada data yang cocok" : "Belum ada data pengeluaran"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Tanggal</th>
                      <th className="text-left p-3">Kategori</th>
                      <th className="text-left p-3">Keterangan</th>
                      <th className="text-right p-3">Jumlah</th>
                      <th className="text-center p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-surface-muted">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {format(new Date(p.tanggal), "dd/MM/yyyy")}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
                            {p.kategori}
                          </span>
                        </td>
                        <td className="p-3">{p.keterangan}</td>
                        <td className="p-3 text-right font-semibold text-red-600">
                          {formatRupiah(p.jumlah)}
                        </td>
                        <td className="p-3 text-center">
                          <Button aria-label={`Hapus ${p.keterangan}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p.id, p.keterangan)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredData.length}
              />
            </>
          )}
        </CardContent>
      </Card>
      {dialog}
    </div>
  );
}
