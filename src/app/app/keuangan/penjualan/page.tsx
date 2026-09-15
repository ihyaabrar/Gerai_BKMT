"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";
import { Receipt, Search, Download, Ban, Undo2, Printer } from "lucide-react";
import { PrintReceipt } from "@/components/PrintReceipt";
import { strukDariPenjualan, type PenjualanUntukStruk } from "@/lib/struk";
import { ReturDialog } from "@/components/ReturDialog";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { CEK_INTERNET } from "@/lib/pesan";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

interface Penjualan extends PenjualanUntukStruk {
  id: string;
  nomorTransaksi: string;
  tanggal: string;
  subtotal: number;
  diskon: number;
  total: number;
  metodeBayar: string;
  status: string;
  alasanBatal: string | null;
  dibatalkanPada: string | null;
  dibatalkanOleh: { nama: string } | null;
  member: {
    nama: string;
  } | null;
  retur?: { nomor: string; totalRefund: number }[];
}

const ITEMS_PER_PAGE = 10;

export default function PenjualanPage() {
  const { user } = useAuthStore();
  // Membatalkan penjualan mengubah uang dan stok sekaligus, jadi hanya
  // pengelola. Kasir yang salah input memanggil pengelola.
  const bolehBatalkan = user?.role === "master" || user?.role === "admin";

  const [targetBatal, setTargetBatal] = useState<Penjualan | null>(null);
  const [targetRetur, setTargetRetur] = useState<string | null>(null);
  const [targetStruk, setTargetStruk] = useState<Penjualan | null>(null);
  const tutupRetur = useCallback(() => setTargetRetur(null), []);
  const [alasanBatal, setAlasanBatal] = useState("");
  const [membatalkan, setMembatalkan] = useState(false);

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
  const [versi, setVersi] = useState(0);

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
  }, [currentPage, debouncedSearch, versi]);

  const batalkan = async () => {
    if (!targetBatal || membatalkan) return;
    setMembatalkan(true);
    try {
      const res = await fetch("/api/penjualan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetBatal.id,
          aksi: "batal",
          alasan: alasanBatal.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || "Gagal membatalkan penjualan");
        return;
      }
      toast.success(`${targetBatal.nomorTransaksi} dibatalkan, stok dikembalikan`);
      setTargetBatal(null);
      setAlasanBatal("");
      setVersi((v) => v + 1);
    } catch {
      toast.error("Transaksi belum dibatalkan", { description: CEK_INTERNET });
    } finally {
      setMembatalkan(false);
    }
  };

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
          <p className="text-slate-500">Semua transaksi. Cetak ulang struk, retur, atau batalkan dari sini.</p>
        </div>
        <Button variant="outline"
          onClick={handleExportExcel}
          disabled={exporting || loading}
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? "Menyiapkan..." : "Unduh Excel"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaksi Terbaru
            </CardTitle>
            <div className="relative w-full sm:w-64">
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
              {/* HP: kartu dengan tombol berlabel — ikon saja sulit ditebak artinya. */}
              <ul className="md:hidden space-y-3">
                {penjualan.map((p) => {
                  const batal = p.status === "batal";
                  return (
                    <li
                      key={p.id}
                      className={cn(
                        "rounded-card border border-border p-3.5",
                        batal ? "bg-rose-50/40" : "bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={cn("font-semibold text-sm text-slate-900", batal && "line-through text-slate-400")}>
                            {new Date(p.tanggal).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            · {p.member?.nama || "Umum"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 break-all">
                            {p.metodeBayar} · {p.nomorTransaksi}
                          </p>
                        </div>
                        <p className={cn("font-bold text-brand-700 shrink-0", batal && "line-through text-slate-400")}>
                          {formatRupiah(p.total)}
                        </p>
                      </div>
                      {p.diskon > 0 && (
                        <p className="text-xs text-brand-600 mt-1">Diskon member −{formatRupiah(p.diskon)}</p>
                      )}
                      {batal && (
                        <p className="text-xs text-rose-700 mt-1.5">
                          Dibatalkan{p.dibatalkanOleh?.nama ? ` oleh ${p.dibatalkanOleh.nama}` : ""}
                          {p.alasanBatal ? ` — ${p.alasanBatal}` : ""}
                        </p>
                      )}
                      {!batal && (p.retur?.length ?? 0) > 0 && (
                        <Badge variant="warning" className="mt-1.5">
                          Retur {formatRupiah(p.retur!.reduce((s, r) => s + r.totalRefund, 0))}
                        </Badge>
                      )}
                      {!batal && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => setTargetStruk(p)}>
                            <Printer className="h-4 w-4 mr-1.5" /> Struk
                          </Button>
                          {bolehBatalkan && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-amber-700"
                              onClick={() => setTargetRetur(p.id)}
                            >
                              <Undo2 className="h-4 w-4 mr-1.5" /> Retur
                            </Button>
                          )}
                          {bolehBatalkan && !(p.retur?.length) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-rose-600"
                              onClick={() => {
                                setTargetBatal(p);
                                setAlasanBatal("");
                              }}
                            >
                              <Ban className="h-4 w-4 mr-1.5" /> Batalkan
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="hidden md:block overflow-x-auto">
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
                      <th className={bolehBatalkan ? "w-28" : "w-12"} />
                    </tr>
                  </thead>
                  <tbody>
                    {penjualan.map((p) => {
                      const batal = p.status === "batal";
                      return (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-b hover:bg-surface-muted",
                          batal && "bg-rose-50/40 text-slate-400"
                        )}
                      >
                        <td className="py-3 px-4 font-medium">
                          <span className={cn(batal && "line-through")}>
                            {p.nomorTransaksi}
                          </span>
                          {batal && (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Badge variant="destructive">Dibatalkan</Badge>
                              {p.dibatalkanOleh?.nama && (
                                <span className="text-xs text-slate-500">
                                  oleh {p.dibatalkanOleh.nama}
                                </span>
                              )}
                            </div>
                          )}
                          {!batal && (p.retur?.length ?? 0) > 0 && (
                            <div className="mt-1">
                              <Badge variant="warning">
                                Retur {formatRupiah(p.retur!.reduce((s, r) => s + r.totalRefund, 0))}
                              </Badge>
                            </div>
                          )}
                          {batal && p.alasanBatal && (
                            <p className="text-xs text-slate-500 mt-0.5 max-w-xs font-normal">
                              {p.alasanBatal}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
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
                        <td
                          className={cn(
                            "py-3 px-4 text-right font-semibold",
                            batal && "line-through"
                          )}
                        >
                          {formatRupiah(p.total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              batal
                                ? "bg-slate-100 text-slate-400"
                                : "bg-brand-100 text-brand-800"
                            )}
                          >
                            {p.metodeBayar}
                          </span>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                            {!batal && (
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={"Cetak ulang struk " + p.nomorTransaksi}
                                title="Cetak ulang struk"
                                className="text-slate-600 hover:bg-surface-muted"
                                onClick={() => setTargetStruk(p)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}
                            {bolehBatalkan && !batal && (
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={"Retur " + p.nomorTransaksi}
                                title="Retur barang dari pembeli"
                                className="text-amber-700 hover:bg-amber-50"
                                onClick={() => setTargetRetur(p.id)}
                              >
                                <Undo2 className="h-4 w-4" />
                              </Button>
                            )}
                            {bolehBatalkan && !batal && !(p.retur?.length) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={"Batalkan " + p.nomorTransaksi}
                                title="Batalkan transaksi"
                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => {
                                  setTargetBatal(p);
                                  setAlasanBatal("");
                                }}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                        </td>
                      </tr>
                      );
                    })}
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

      <Dialog open={targetStruk !== null} onOpenChange={(buka) => !buka && setTargetStruk(null)}>
        <DialogContent className="sm:max-w-md" onClose={() => setTargetStruk(null)}>
          <DialogHeader>
            <DialogTitle>Cetak Ulang Struk</DialogTitle>
          </DialogHeader>
          {targetStruk && (
            <>
              {(targetStruk.retur?.length ?? 0) > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2.5 mb-3">
                  Transaksi ini sudah pernah diretur. Struk menampilkan pembelian aslinya.
                </p>
              )}
              <PrintReceipt data={strukDariPenjualan(targetStruk, { salinan: true })} />
            </>
          )}
        </DialogContent>
      </Dialog>

      <ReturDialog
        penjualanId={targetRetur}
        onTutup={tutupRetur}
        onBerhasil={() => setVersi((v) => v + 1)}
      />

      <Dialog
        open={Boolean(targetBatal)}
        onOpenChange={(buka) => {
          if (!buka && !membatalkan) {
            setTargetBatal(null);
            setAlasanBatal("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batalkan {targetBatal?.nomorTransaksi}?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-card border border-border bg-surface-muted p-3.5 text-sm space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Total</span>
                <span className="font-semibold text-slate-900">
                  {formatRupiah(targetBatal?.total ?? 0)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Member</span>
                <span className="text-slate-700">
                  {targetBatal?.member?.nama || "Umum"}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed">
              Stok akan dikembalikan dan poin member ditarik kembali. Transaksinya
              tidak dihapus — tetap tercatat sebagai dibatalkan, lengkap dengan
              nama Anda dan alasan di bawah.
            </p>

            <div>
              <label
                htmlFor="alasan-batal"
                className="block text-sm font-medium text-slate-700"
              >
                Alasan pembatalan <span className="text-red-500">*</span>
              </label>
              <textarea
                id="alasan-batal"
                rows={3}
                value={alasanBatal}
                onChange={(e) => setAlasanBatal(e.target.value)}
                placeholder="Contoh: salah input jumlah, pembeli membatalkan pesanan"
                className="mt-1.5 flex w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="text-xs text-slate-500 mt-1">
                Minimal 5 karakter. Inilah yang dibaca kalau pertanyaannya muncul
                lagi bulan depan.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                disabled={membatalkan}
                onClick={() => {
                  setTargetBatal(null);
                  setAlasanBatal("");
                }}
              >
                Tutup
              </Button>
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white"
                disabled={membatalkan || alasanBatal.trim().length < 5}
                onClick={batalkan}
              >
                {membatalkan ? "Membatalkan..." : "Batalkan Transaksi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
