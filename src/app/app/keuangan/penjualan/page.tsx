"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";
import { Receipt, Search, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton";

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

const ITEMS_PER_PAGE = 10;

export default function PenjualanPage() {
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Tunda pencarian supaya tidak memanggil API di setiap ketikan.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Paginasi & pencarian dikerjakan server, bukan lagi memuat
  // seluruh riwayat transaksi ke browser.
  useEffect(() => {
    const controller = new AbortController();

    const fetchPenjualan = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
        });
        if (debouncedSearch) params.set("search", debouncedSearch);

        const res = await fetch(`/api/penjualan?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const json = await res.json();

        setPenjualan(json.data ?? []);
        setTotalItems(json.pagination?.total ?? 0);
        setTotalPages(Math.max(json.pagination?.totalPages ?? 1, 1));
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") {
          toast.error("Gagal memuat riwayat penjualan");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPenjualan();
    return () => controller.abort();
  }, [currentPage, debouncedSearch]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "200" });
      if (debouncedSearch) params.set("search", debouncedSearch);

      // Ambil sampai 200 baris terbaru sesuai filter aktif.
      const res = await fetch(`/api/penjualan?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const rows: Penjualan[] = json.data ?? [];

      if (rows.length === 0) {
        toast.info("Tidak ada data untuk diekspor");
        return;
      }

      exportRows(rows);
      toast.success(`${rows.length} transaksi diekspor`);
    } catch {
      toast.error("Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  };

  const exportRows = (rows: Penjualan[]) => {
    const exportData = rows.map((p) => ({
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
    const maxWidth = exportData.reduce(
      (w, r) => Math.max(w, r["No. Transaksi"].length),
      10
    );
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
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Riwayat Penjualan</h1>
          <p className="text-slate-500">Data transaksi penjualan</p>
        </div>
        <Button variant="outline"
          onClick={handleExportExcel}
          disabled={exporting || loading}
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? "Menyiapkan..." : "Export Excel"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaksi Terbaru
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input aria-label="Cari transaksi..."
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
            <TableSkeleton cols={7} />
          ) : penjualan.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {search ? "Tidak ada data yang cocok" : "Belum ada transaksi"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
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
                    {penjualan.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-surface-muted">
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
                        <td className="py-3 px-4 text-right text-brand-600">
                          {p.diskon > 0 ? `-${formatRupiah(p.diskon)}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatRupiah(p.total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-1 bg-brand-100 text-brand-800 rounded-full text-xs font-medium">
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
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={totalItems}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
