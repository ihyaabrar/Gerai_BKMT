"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateBarcode, formatRupiah } from "@/lib/utils";
import { PackagePlus, Package, Search, Plus, RefreshCw, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Barang {
  id: string;
  kode: string;
  barcode: string;
  nama: string;
  kategori: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  stokMinimum: number;
  satuan: string;
}

interface KategoriBarang {
  id: string;
  nama: string;
}

export default function BarangMasukPage() {
  const [mode, setMode] = useState<"pilih" | "baru">("pilih");
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriBarang[]>([]);
  const [search, setSearch] = useState("");
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);
  const [jumlahMasuk, setJumlahMasuk] = useState("");
  const [updateHargaBeli, setUpdateHargaBeli] = useState(false);
  const [hargaBeliBaru, setHargaBeliBaru] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [formBaru, setFormBaru] = useState({
    kode: "",
    barcode: "",
    nama: "",
    kategori: "",
    hargaBeli: "",
    hargaJual: "",
    stok: "",
    stokMinimum: "5",
    satuan: "pcs",
  });

  useEffect(() => {
    fetchBarang();
    fetchKategori();
  }, []);

  const fetchKategori = async () => {
    try {
      const res = await fetch("/api/kategori-barang");
      const data = await res.json();
      setKategoriList(data);
    } catch {
      // ignore
    }
  };

  const fetchBarang = async () => {
    try {
      const res = await fetch("/api/barang");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBarangList(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Gagal memuat data barang");
    }
  };

  const handleGenerateBarcode = () => {
    setFormBaru({ ...formBaru, barcode: generateBarcode() });
  };

  const handleUpdateStok = async () => {
    if (!selectedBarang || !jumlahMasuk) {
      toast.error("Pilih barang dan masukkan jumlah");
      return;
    }

    const qty = parseInt(jumlahMasuk);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    try {
      // Satu endpoint: penambahan stok dan pencatatan pengeluaran
      // dilakukan dalam satu transaksi di server.
      const res = await fetch("/api/barang-masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "existing",
          barangId: selectedBarang.id,
          qty,
          updateHargaBeli,
          hargaBeliBaru: updateHargaBeli ? hargaBeliBaru : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Gagal mencatat barang masuk");
        return;
      }

      toast.success(
        `Stok ${selectedBarang.nama} bertambah ${qty} ${selectedBarang.satuan}. ` +
          `Pengeluaran ${formatRupiah(data.totalPengeluaran)} tercatat.`
      );
      setSelectedBarang(null);
      setJumlahMasuk("");
      setUpdateHargaBeli(false);
      setHargaBeliBaru("");
      fetchBarang();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTambahBaru = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/barang-masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "baru",
          ...formBaru,
          hargaBeli: Number(formBaru.hargaBeli),
          hargaJual: Number(formBaru.hargaJual),
          stok: Number(formBaru.stok),
          stokMinimum: Number(formBaru.stokMinimum),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Tampilkan pesan spesifik dari server (kode/barcode duplikat, dll)
        toast.error(data?.error || "Gagal menambah barang");
        return;
      }

      toast.success(
        `Barang baru ditambahkan. Pengeluaran ${formatRupiah(data.totalPengeluaran)} tercatat.`
      );
      setFormBaru({
        kode: "",
        barcode: "",
        nama: "",
        kategori: "",
        hargaBeli: "",
        hargaJual: "",
        stok: "",
        stokMinimum: "5",
        satuan: "pcs",
      });
      fetchBarang();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBarang = barangList.filter(
    (b) =>
      b.nama.toLowerCase().includes(search.toLowerCase()) ||
      b.kode.toLowerCase().includes(search.toLowerCase()) ||
      b.barcode.toLowerCase().includes(search.toLowerCase())
  );

  // Hitung total pengeluaran untuk preview
  const calculateTotalPengeluaran = () => {
    if (!selectedBarang || !jumlahMasuk) return 0;
    const qty = parseInt(jumlahMasuk);
    const hargaBeli = updateHargaBeli && hargaBeliBaru 
      ? parseFloat(hargaBeliBaru) 
      : selectedBarang.hargaBeli;
    return hargaBeli * qty;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Barang Masuk
        </h1>
        <p className="text-slate-600 mt-2">Tambah stok barang yang sudah ada atau tambah produk baru</p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-3">
        <Button
          onClick={() => {
            setMode("pilih");
            setSelectedBarang(null);
            setJumlahMasuk("");
            setUpdateHargaBeli(false);
            setHargaBeliBaru("");
          }}
          variant={mode === "pilih" ? "default" : "outline"}
          className={mode === "pilih" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          <Package className="h-4 w-4 mr-2" />
          Update Stok Barang
        </Button>
        <Button
          onClick={() => setMode("baru")}
          variant={mode === "baru" ? "default" : "outline"}
          className={mode === "baru" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Barang Baru
        </Button>
      </div>

      {/* Mode: Update Stok */}
      {mode === "pilih" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Barang */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Package className="h-4 w-4 text-white" />
                </div>
                Pilih Barang
              </CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input aria-label="Cari barang..."
                  placeholder="Cari barang..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredBarang.map((barang) => (
                  <div
                    key={barang.id}
                    onClick={() => {
                      setSelectedBarang(barang);
                      setHargaBeliBaru(barang.hargaBeli.toString());
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover-lift ${
                      selectedBarang?.id === barang.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex flex-wrap gap-3 justify-between items-start">
                      <div>
                        <p className="font-bold text-brand-900">{barang.nama}</p>
                        <p className="text-sm text-slate-500">{barang.kode} • {barang.barcode}</p>
                        <p className="text-xs text-slate-400 mt-1">{barang.kategori}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={barang.stok <= barang.stokMinimum ? "destructive" : "outline"}>
                          Stok: {barang.stok} {barang.satuan}
                        </Badge>
                        <p className="text-sm text-slate-600 mt-1">{formatRupiah(barang.hargaBeli)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredBarang.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    {search ? "Tidak ada barang yang cocok" : "Belum ada barang"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Update Stok */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <RefreshCw className="h-4 w-4 text-white" />
                </div>
                Update Stok
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedBarang ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-brand-200">
                    <p className="font-bold text-brand-900 mb-1">{selectedBarang.nama}</p>
                    <p className="text-sm text-slate-600">{selectedBarang.kode}</p>
                    <div className="mt-3 pt-3 border-t border-brand-200">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Stok Saat Ini:</span>
                        <span className="font-semibold">{selectedBarang.stok} {selectedBarang.satuan}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Harga Beli:</span>
                        <span className="font-semibold">{formatRupiah(selectedBarang.hargaBeli)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="jumlah-masuk">Jumlah Masuk</label>
                    <Input id="jumlah-masuk"
                      type="number"
                      value={jumlahMasuk}
                      onChange={(e) => setJumlahMasuk(e.target.value)}
                      placeholder="0"
                      className="mt-1"
                      min="1"
                    />
                  </div>

                  {/* Checkbox Update Harga Beli */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="updateHargaBeli"
                      checked={updateHargaBeli}
                      onChange={(e) => setUpdateHargaBeli(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="updateHargaBeli" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Update Harga Beli
                    </label>
                  </div>

                  {/* Input Harga Beli Baru */}
                  {updateHargaBeli && (
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="harga-beli-baru">Harga Beli Baru</label>
                      <Input id="harga-beli-baru"
                        type="number"
                        value={hargaBeliBaru}
                        onChange={(e) => setHargaBeliBaru(e.target.value)}
                        placeholder="0"
                        className="mt-1"
                        min="0"
                      />
                    </div>
                  )}

                  {/* Preview */}
                  {jumlahMasuk && parseInt(jumlahMasuk) > 0 && (
                    <div className="space-y-2">
                      <div className="p-3 bg-brand-50 rounded-lg border border-brand-200">
                        <p className="text-sm text-slate-600 mb-1">Stok Setelah Update:</p>
                        <p className="text-2xl font-bold text-brand-600">
                          {selectedBarang.stok + parseInt(jumlahMasuk)} {selectedBarang.satuan}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-medium text-slate-700">Total Pengeluaran:</p>
                        </div>
                        <p className="text-xl font-bold text-amber-600">
                          {formatRupiah(calculateTotalPengeluaran())}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {parseInt(jumlahMasuk)} × {formatRupiah(updateHargaBeli && hargaBeliBaru ? parseFloat(hargaBeliBaru) : selectedBarang.hargaBeli)}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleUpdateStok}
                    className="w-full"
                    disabled={submitting || !jumlahMasuk || parseInt(jumlahMasuk) <= 0}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {submitting ? "Menyimpan..." : "Update Stok & Catat Pengeluaran"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Pilih barang dari daftar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mode: Tambah Baru */}
      {mode === "baru" && (
        <Card className="max-w-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <PackagePlus className="h-4 w-4 text-white" />
              </div>
              Form Barang Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTambahBaru} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="kode-barang">Kode Barang</label>
                  <Input id="kode-barang"
                    required
                    value={formBaru.kode}
                    onChange={(e) => setFormBaru({ ...formBaru, kode: e.target.value })}
                    placeholder="BRG001"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="barang-barcode" className="text-sm font-medium text-slate-700">Barcode</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="barang-barcode"
                      value={formBaru.barcode}
                      onChange={(e) => setFormBaru({ ...formBaru, barcode: e.target.value })}
                      placeholder="Auto generate"
                    />
                    <Button type="button" onClick={handleGenerateBarcode} variant="outline">
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="nama-barang">Nama Barang</label>
                <Input id="nama-barang"
                  required
                  value={formBaru.nama}
                  onChange={(e) => setFormBaru({ ...formBaru, nama: e.target.value })}
                  placeholder="Nama produk"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="kategori">Kategori</label>
                <select id="kategori"
                  value={formBaru.kategori}
                  onChange={(e) => setFormBaru({ ...formBaru, kategori: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="harga-beli">Harga Beli</label>
                  <Input id="harga-beli"
                    required
                    type="number"
                    value={formBaru.hargaBeli}
                    onChange={(e) => setFormBaru({ ...formBaru, hargaBeli: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="harga-jual">Harga Jual</label>
                  <Input id="harga-jual"
                    required
                    type="number"
                    value={formBaru.hargaJual}
                    onChange={(e) => setFormBaru({ ...formBaru, hargaJual: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="stok-awal">Stok Awal</label>
                  <Input id="stok-awal"
                    required
                    type="number"
                    value={formBaru.stok}
                    onChange={(e) => setFormBaru({ ...formBaru, stok: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="stok-minimum">Stok Minimum</label>
                  <Input id="stok-minimum"
                    required
                    type="number"
                    value={formBaru.stokMinimum}
                    onChange={(e) => setFormBaru({ ...formBaru, stokMinimum: e.target.value })}
                    placeholder="5"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="satuan">Satuan</label>
                  <Input id="satuan"
                    required
                    value={formBaru.satuan}
                    onChange={(e) => setFormBaru({ ...formBaru, satuan: e.target.value })}
                    placeholder="pcs"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Preview Total Pengeluaran */}
              {formBaru.stok && formBaru.hargaBeli && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-semibold text-slate-700">Total Pengeluaran:</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatRupiah(parseInt(formBaru.stok || "0") * parseFloat(formBaru.hargaBeli || "0"))}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formBaru.stok} {formBaru.satuan} × {formatRupiah(parseFloat(formBaru.hargaBeli || "0"))}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 font-semibold"
                size="lg"
              >
                <PackagePlus className="mr-2 h-5 w-5" />
                {submitting ? "Menyimpan..." : "Simpan Barang & Catat Pengeluaran"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
