"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";
import { Receipt, Search, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

interface Penjualan {
  id: string;
  nomorTransaksi: string;
  tanggal: string;
  subtotal: number;
  diskon: number;
  total: number;
  metodeBayar: string;
  member: {
    nama: string;
  } | null;
}

export default function PenjualanPage() {
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [filteredData, setFilteredData] = useState<Penjualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPenjualan();
  }, []);

  useEffect(() => {
    const filtered = penjualan.filter(
      (p) =>
        p.nomorTransaksi.toLowerCase().includes(search.toLowerCase()) ||
        p.member?.nama.toLowerCase().includes(search.toLowerCase()) ||
        p.metodeBayar.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [search, penjualan]);

  const fetchPenjualan = async () => {
    try {
      const res = await fetch("/api/penjualan");
      const data = await res.json();
      setPenjualan(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Failed to fetch penjualan:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const exportData = filteredData.map((p) => ({
      "No. Transaksi": p.nomorTransaksi,
      Tanggal: new Date(p.tanggal).toLocaleDateString("id-ID"),
      Member: p.member?.nama || "Umum",
      Subtotal: p.subtotal,
      Diskon: p.diskon,
      Total: p.total,
      "Metode Bayar": p.metodeBayar,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Penjualan");

    // Auto width columns
    const maxWidth = exportData.reduce((w, r) => Math.max(w, r["No. Transaksi"].length), 10);
    ws["!cols"] = [
      { wch: maxWidth },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.writeFile(wb, `Penjualan_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Riwayat Penjualan</h1>
          <p className="text-gray-500">Data transaksi penjualan</p>
        </div>
        <Button
          onClick={handleExportExcel}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaksi Terbaru
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari transaksi..."
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
              {search ? "Tidak ada data yang cocok" : "Belum ada transaksi"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">No. Transaksi</th>
                      <th className="text-left py-3 px-4">Tanggal</th>
                      <th className="text-left py-3 px-4">Member</th>
                      <th className="text-right py-3 px-4">Subtotal</th>
                      <th className="text-right py-3 px-4">Diskon</th>
                      <th className="text-right py-3 px-4">Total</th>
                      <th className="text-center py-3 px-4">Metode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{p.nomorTransaksi}</td>
                        <td className="py-3 px-4">
                          {new Date(p.tanggal).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4">{p.member?.nama || "Umum"}</td>
                        <td className="py-3 px-4 text-right">{formatRupiah(p.subtotal)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">
                          {p.diskon > 0 ? `-${formatRupiah((p.subtotal * p.diskon) / 100)}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatRupiah(p.total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {p.metodeBayar}
                          </span>
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
