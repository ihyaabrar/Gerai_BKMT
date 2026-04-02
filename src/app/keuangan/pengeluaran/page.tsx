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

interface Pengeluaran {
  id: string;
  tanggal: string;
  kategori: string;
  keterangan: string;
  jumlah: number;
}

const KATEGORI_OPTIONS = [
  "Gaji",
  "Listrik",
  "Air",
  "Sewa",
  "Transportasi",
  "Pemeliharaan",
  "Perlengkapan",
  "Lainnya",
];

export default function PengeluaranPage() {
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [filteredData, setFilteredData] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [form, setForm] = useState({
    tanggal: format(new Date(), "yyyy-MM-dd"),
    kategori: "Gaji",
    keterangan: "",
    jumlah: "",
  });

  const fetchPengeluaran = async () => {
    try {
      const res = await fetch("/api/pengeluaran");
      const data = await res.json();
      setPengeluaran(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Failed to fetch pengeluaran:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengeluaran();
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
    try {
      const res = await fetch("/api/pengeluaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setOpen(false);
        setForm({
          tanggal: format(new Date(), "yyyy-MM-dd"),
          kategori: "Gaji",
          keterangan: "",
          jumlah: "",
        });
        fetchPengeluaran();
      }
    } catch (error) {
      console.error("Failed to create pengeluaran:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return;

    try {
      const res = await fetch(`/api/pengeluaran?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchPengeluaran();
      }
    } catch (error) {
      console.error("Failed to delete pengeluaran:", error);
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pengeluaran</h1>
          <p className="text-gray-500">Catat pengeluaran operasional</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
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
                <label className="text-sm font-medium">Tanggal</label>
                <Input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  required
                >
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Keterangan</label>
                <Input
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Deskripsi pengeluaran"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Jumlah</label>
                <Input
                  type="number"
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                  placeholder="0"
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
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Riwayat Pengeluaran
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
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
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search ? "Tidak ada data yang cocok" : "Belum ada data pengeluaran"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
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
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p.id)}
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
    </div>
  );
}
