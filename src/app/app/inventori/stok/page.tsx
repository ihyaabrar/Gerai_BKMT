"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Package, AlertTriangle, Search, Pencil } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { gambarLebar, LEBAR } from "@/lib/gambar";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth";

interface Barang {
  id: string;
  kode: string;
  barcode: string | null;
  gambarUrl: string | null;
  nama: string;
  kategori: string | null;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  stokMinimum: number;
  satuan: string;
}

type Filter = "semua" | "rendah" | "habis";

interface FormEdit {
  kode: string;
  barcode: string;
  nama: string;
  kategori: string;
  hargaBeli: string;
  hargaJual: string;
  stokMinimum: string;
  satuan: string;
  gambarUrl: string;
}

const kelasSelect =
  "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function StokPage() {
  const [barang, setBarang] = useState<Barang[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [loading, setLoading] = useState(true);

  // Mengubah harga menentukan laba, jadi hanya admin & master (sama dengan API).
  const role = useAuthStore((s) => s.user?.role);
  const bolehEdit = role === "master" || role === "admin";

  const [diedit, setDiedit] = useState<Barang | null>(null);
  const [form, setForm] = useState<FormEdit | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [kategoriList, setKategoriList] = useState<{ id: string; nama: string }[]>([]);

  const muat = () =>
    fetch("/api/barang")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setBarang(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Gagal memuat data stok"))
      .finally(() => setLoading(false));

  useEffect(() => {
    muat();
  }, []);

  const bukaEdit = (b: Barang) => {
    setDiedit(b);
    setForm({
      kode: b.kode,
      barcode: b.barcode ?? "",
      nama: b.nama,
      kategori: b.kategori ?? "",
      hargaBeli: String(b.hargaBeli),
      hargaJual: String(b.hargaJual),
      stokMinimum: String(b.stokMinimum),
      satuan: b.satuan,
      gambarUrl: b.gambarUrl ?? "",
    });
    if (kategoriList.length === 0) {
      fetch("/api/kategori-barang")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setKategoriList(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  };

  const tutupEdit = () => {
    setDiedit(null);
    setForm(null);
  };

  const simpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diedit || !form || menyimpan) return;

    const hargaBeli = Number(form.hargaBeli);
    const hargaJual = Number(form.hargaJual);
    if (hargaJual < hargaBeli) {
      toast.error("Harga jual tidak boleh lebih kecil dari harga beli");
      return;
    }

    setMenyimpan(true);
    try {
      const res = await fetch("/api/barang", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: diedit.id,
          kode: form.kode,
          barcode: form.barcode,
          nama: form.nama,
          kategori: form.kategori,
          hargaBeli,
          hargaJual,
          stokMinimum: Number(form.stokMinimum),
          satuan: form.satuan,
          gambarUrl: form.gambarUrl,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan perubahan");
        return;
      }
      toast.success(`${form.nama} diperbarui`);
      tutupEdit();
      muat();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setMenyimpan(false);
    }
  };

  const hargaBeliBerubah =
    diedit !== null && form !== null && Number(form.hargaBeli) !== diedit.hargaBeli;

  const nilaiInventori = barang.reduce((sum, b) => sum + b.hargaBeli * b.stok, 0);
  // Gunakan stokMinimum per barang (bukan hardcode 5)
  const stokRendah = barang.filter((b) => b.stok > 0 && b.stok <= b.stokMinimum);
  const stokHabis = barang.filter((b) => b.stok === 0);

  const filtered = barang.filter((b) => {
    const matchSearch =
      b.nama.toLowerCase().includes(search.toLowerCase()) ||
      b.kode.toLowerCase().includes(search.toLowerCase()) ||
      (b.kategori || "").toLowerCase().includes(search.toLowerCase());

    if (filter === "rendah") return matchSearch && b.stok > 0 && b.stok <= b.stokMinimum;
    if (filter === "habis") return matchSearch && b.stok === 0;
    return matchSearch;
  });

  const getStatus = (b: Barang) =>
    b.stok === 0
      ? { label: "Habis", color: "bg-red-100 text-red-800" }
      : b.stok <= b.stokMinimum
      ? { label: "Rendah", color: "bg-amber-100 text-amber-800" }
      : { label: "Aman", color: "bg-emerald-100 text-emerald-800" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Stok Barang</h1>
        <p className="text-slate-500">Monitoring inventori real-time</p>
      </div>

      {/* Alert stok rendah/habis */}
      {(stokRendah.length > 0 || stokHabis.length > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Perhatian: Stok Perlu Diisi</p>
            <p className="text-sm text-amber-700 mt-1">
              {stokHabis.length > 0 && (
                <span className="font-medium text-red-700">{stokHabis.length} barang habis</span>
              )}
              {stokHabis.length > 0 && stokRendah.length > 0 && " · "}
              {stokRendah.length > 0 && (
                <span>{stokRendah.length} barang stok rendah (di bawah minimum)</span>
              )}
            </p>
            {stokHabis.length > 0 && (
              <p className="text-xs text-red-600 mt-1">
                Habis: {stokHabis.slice(0, 5).map((b) => b.nama).join(", ")}
                {stokHabis.length > 5 && ` +${stokHabis.length - 5} lainnya`}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Barang</CardTitle>
            <Package className="h-5 w-5 text-brand-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barang.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Stok Rendah / Habis</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stokRendah.length + stokHabis.length}
            </div>
            <p className="text-xs text-slate-400 mt-1">{stokHabis.length} habis · {stokRendah.length} rendah</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Nilai Inventori</CardTitle>
            <Package className="h-5 w-5 text-brand-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(nilaiInventori)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2">
              {(["semua", "rendah", "habis"] as Filter[]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? "default" : "outline"}
                  className={filter === f ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  onClick={() => setFilter(f)}
                >
                  {f === "semua"
                    ? "Semua"
                    : f === "rendah"
                    ? `Rendah (${stokRendah.length})`
                    : `Habis (${stokHabis.length})`}
                </Button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input aria-label="Cari barang..."
                placeholder="Cari barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton cols={8} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada barang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Kode</th>
                    <th className="text-left py-3 px-4">Nama Barang</th>
                    <th className="text-left py-3 px-4">Kategori</th>
                    <th className="text-right py-3 px-4">Harga Beli</th>
                    <th className="text-right py-3 px-4">Harga Jual</th>
                    <th className="text-center py-3 px-4">Stok</th>
                    <th className="text-center py-3 px-4">Min</th>
                    <th className="text-center py-3 px-4">Status</th>
                    {bolehEdit && <th className="text-center py-3 px-4">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const status = getStatus(b);
                    return (
                      <tr key={b.id} className={`border-b border-border/70 hover:bg-surface-muted ${b.stok === 0 ? "bg-rose-50/40" : b.stok <= b.stokMinimum ? "bg-amber-50/40" : ""}`}>
                        <td className="py-3 px-4 font-medium text-sm">{b.kode}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Foto produk; inisial nama dipakai bila belum ada */}
                            <div className="h-9 w-9 rounded-lg bg-surface-sunken border border-border overflow-hidden shrink-0 flex items-center justify-center">
                              {b.gambarUrl ? (
                                <img
                                    src={gambarLebar(b.gambarUrl, LEBAR.ikon)}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    width={LEBAR.ikon}
                                    height={LEBAR.ikon}
                                    className="h-full w-full object-cover"
                                  />
                              ) : (
                                <span className="text-xs font-bold text-brand-300">
                                  {b.nama.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="truncate">{b.nama}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-sm">{b.kategori || "-"}</td>
                        <td className="py-3 px-4 text-right text-sm">{formatRupiah(b.hargaBeli)}</td>
                        <td className="py-3 px-4 text-right text-sm">{formatRupiah(b.hargaJual)}</td>
                        <td className="py-3 px-4 text-center font-semibold">
                          {b.stok} <span className="text-xs text-slate-400">{b.satuan}</span>
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-slate-400">{b.stokMinimum}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        {bolehEdit && (
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Edit ${b.nama}`}
                              onClick={() => bukaEdit(b)}
                            >
                              <Pencil className="h-4 w-4 text-brand-600" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={diedit !== null} onOpenChange={(buka) => !buka && tutupEdit()}>
        <DialogContent onClose={tutupEdit}>
          <DialogHeader>
            <DialogTitle>Edit Barang</DialogTitle>
          </DialogHeader>
          {form && diedit && (
            <form onSubmit={simpanEdit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label htmlFor="edit-nama" className="text-sm font-medium text-slate-700">Nama Barang</label>
                <Input id="edit-nama" required value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-kode" className="text-sm font-medium text-slate-700">Kode</label>
                  <Input id="edit-kode" required value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label htmlFor="edit-barcode" className="text-sm font-medium text-slate-700">Barcode</label>
                  <Input id="edit-barcode" value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="mt-1" />
                </div>
              </div>

              <div>
                <label htmlFor="edit-kategori" className="text-sm font-medium text-slate-700">Kategori</label>
                <select id="edit-kategori" value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })} className={kelasSelect}>
                  <option value="">-- Tanpa Kategori --</option>
                  {/* Kategori lama yang sudah tidak ada di daftar tetap bisa dipertahankan. */}
                  {form.kategori && !kategoriList.some((k) => k.nama === form.kategori) && (
                    <option value={form.kategori}>{form.kategori}</option>
                  )}
                  {kategoriList.map((k) => (
                    <option key={k.id} value={k.nama}>{k.nama}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-beli" className="text-sm font-medium text-slate-700">Harga Beli</label>
                  <Input id="edit-beli" required type="number" min={0} value={form.hargaBeli}
                    onChange={(e) => setForm({ ...form, hargaBeli: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label htmlFor="edit-jual" className="text-sm font-medium text-slate-700">Harga Jual</label>
                  <Input id="edit-jual" required type="number" min={0} value={form.hargaJual}
                    onChange={(e) => setForm({ ...form, hargaJual: e.target.value })} className="mt-1" />
                </div>
              </div>
              {hargaBeliBerubah && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2.5">
                  Harga beli baru hanya dipakai untuk penjualan <strong>berikutnya</strong>. Laba
                  penjualan yang sudah terjadi tidak berubah. Kalau harga naik karena pembelian
                  baru dari supplier, lebih tepat dicatat lewat <strong>Barang Masuk</strong>.
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-min" className="text-sm font-medium text-slate-700">Stok Minimum</label>
                  <Input id="edit-min" required type="number" min={0} value={form.stokMinimum}
                    onChange={(e) => setForm({ ...form, stokMinimum: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label htmlFor="edit-satuan" className="text-sm font-medium text-slate-700">Satuan</label>
                  <Input id="edit-satuan" required value={form.satuan}
                    onChange={(e) => setForm({ ...form, satuan: e.target.value })} className="mt-1" />
                </div>
              </div>

              <div className="rounded-md bg-surface-muted p-3 text-sm">
                <span className="text-slate-500">Stok sekarang: </span>
                <span className="font-semibold">{diedit.stok} {diedit.satuan}</span>
                <p className="text-xs text-slate-500 mt-1">
                  Stok tidak diubah di sini. Tambah lewat Barang Masuk, kurangi lewat Penyesuaian —
                  supaya setiap perubahan tercatat.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Foto Produk</p>
                <ImageUpload value={form.gambarUrl}
                  onChange={(url) => setForm({ ...form, gambarUrl: url })}
                  folder="barang" label="Ganti Foto" shape="square" previewSize="sm" />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={tutupEdit}>
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={menyimpan}>
                  {menyimpan ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
