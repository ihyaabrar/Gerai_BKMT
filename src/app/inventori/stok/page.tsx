"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, Search } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface Barang {
  id: string;
  kode: string;
  nama: string;
  kategori: string | null;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  stokMinimum: number;
  satuan: string;
}

type Filter = "semua" | "rendah" | "habis";

export default function StokPage() {
  const [barang, setBarang] = useState<Barang[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/barang")
      .then((r) => r.json())
      .then((data) => setBarang(data))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-3xl font-bold">Stok Barang</h1>
        <p className="text-gray-500">Monitoring inventori real-time</p>
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Barang</CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barang.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stok Rendah / Habis</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stokRendah.length + stokHabis.length}
            </div>
            <p className="text-xs text-gray-400 mt-1">{stokHabis.length} habis · {stokRendah.length} rendah</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nilai Inventori</CardTitle>
            <Package className="h-5 w-5 text-emerald-600" />
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
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
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
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada barang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const status = getStatus(b);
                    return (
                      <tr key={b.id} className={`border-b hover:bg-gray-50 ${b.stok === 0 ? "bg-red-50" : b.stok <= b.stokMinimum ? "bg-amber-50" : ""}`}>
                        <td className="py-3 px-4 font-medium text-sm">{b.kode}</td>
                        <td className="py-3 px-4">{b.nama}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{b.kategori || "-"}</td>
                        <td className="py-3 px-4 text-right text-sm">{formatRupiah(b.hargaBeli)}</td>
                        <td className="py-3 px-4 text-right text-sm">{formatRupiah(b.hargaJual)}</td>
                        <td className="py-3 px-4 text-center font-semibold">
                          {b.stok} <span className="text-xs text-gray-400">{b.satuan}</span>
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-gray-400">{b.stokMinimum}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
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
    </div>
  );
}
