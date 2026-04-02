"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClipboardList, History, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface Barang {
  id: string;
  kode: string;
  nama: string;
  stok: number;
}

interface Penyesuaian {
  id: string;
  tanggal: string;
  jenis: string;
  qty: number;
  alasan: string;
  barang: { nama: string; kode: string };
}

export default function PenyesuaianPage() {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [history, setHistory] = useState<Penyesuaian[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);
  const [form, setForm] = useState({ barangId: "", jenis: "masuk", qty: "", alasan: "" });
  const [confirmHapus, setConfirmHapus] = useState(false);

  useEffect(() => {
    fetchBarang();
    fetchHistory();
  }, []);

  const fetchBarang = async () => {
    const res = await fetch("/api/barang");
    const data = await res.json();
    setBarangList(data);
  };

  const fetchHistory = async () => {
    const res = await fetch("/api/penyesuaian");
    const data = await res.json();
    setHistory(data);
  };

  const handleBarangChange = (id: string) => {
    const barang = barangList.find((b) => b.id === id) || null;
    setSelectedBarang(barang);
    setConfirmHapus(false);
    setForm((f) => ({ ...f, barangId: id }));
  };

  const handleHapusBarang = async () => {
    if (!selectedBarang) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/barang?id=${selectedBarang.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus barang");
        return;
      }
      toast.success(`Barang "${selectedBarang.nama}" berhasil dihapus`);
      setForm({ barangId: "", jenis: "masuk", qty: "", alasan: "" });
      setSelectedBarang(null);
      setConfirmHapus(false);
      fetchBarang();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.qty || parseInt(form.qty) <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/penyesuaian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan penyesuaian");
        return;
      }

      toast.success("Penyesuaian stok berhasil dicatat");
      setForm({ barangId: "", jenis: "masuk", qty: "", alasan: "" });
      setSelectedBarang(null);
      fetchBarang();
      fetchHistory();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const stokSetelah = selectedBarang && form.qty
    ? form.jenis === "masuk"
      ? selectedBarang.stok + parseInt(form.qty || "0")
      : selectedBarang.stok - parseInt(form.qty || "0")
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Penyesuaian Stok</h1>
        <p className="text-gray-500">Stock opname dan koreksi stok</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Form Penyesuaian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Pilih Barang</label>
                <select
                  required
                  value={form.barangId}
                  onChange={(e) => handleBarangChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mt-1"
                >
                  <option value="">-- Pilih Barang --</option>
                  {barangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama} ({b.kode}) — Stok: {b.stok}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Jenis Penyesuaian</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Button
                    type="button"
                    variant={form.jenis === "masuk" ? "default" : "outline"}
                    className={form.jenis === "masuk" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    onClick={() => setForm({ ...form, jenis: "masuk" })}
                  >
                    + Tambah Stok
                  </Button>
                  <Button
                    type="button"
                    variant={form.jenis === "keluar" ? "default" : "outline"}
                    className={form.jenis === "keluar" ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => setForm({ ...form, jenis: "keluar" })}
                  >
                    − Kurangi Stok
                  </Button>
                  <Button
                    type="button"
                    variant={form.jenis === "hapus" ? "default" : "outline"}
                    className={form.jenis === "hapus" ? "bg-gray-800 hover:bg-gray-900" : ""}
                    onClick={() => setForm({ ...form, jenis: "hapus" })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus Barang
                  </Button>
                </div>
              </div>

              {form.jenis !== "hapus" && (
                <>
                  <div>
                    <label className="text-sm font-medium">Jumlah</label>
                    <Input
                      required
                      type="number"
                      min="1"
                      value={form.qty}
                      onChange={(e) => setForm({ ...form, qty: e.target.value })}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Alasan</label>
                    <Input
                      required
                      value={form.alasan}
                      onChange={(e) => setForm({ ...form, alasan: e.target.value })}
                      placeholder="Rusak, hilang, stock opname, dll"
                      className="mt-1"
                    />
                  </div>

                  {selectedBarang && form.qty && (
                    <div className={`p-3 rounded-lg border-2 ${
                      stokSetelah !== null && stokSetelah < 0
                        ? "bg-red-50 border-red-200"
                        : "bg-blue-50 border-blue-200"
                    }`}>
                      <p className="text-sm font-medium text-gray-700">Preview Stok</p>
                      <div className="flex justify-between mt-1 text-sm">
                        <span className="text-gray-600">Stok saat ini: <strong>{selectedBarang.stok}</strong></span>
                        <span className={stokSetelah !== null && stokSetelah < 0 ? "text-red-600 font-bold" : "text-blue-700 font-bold"}>
                          Setelah: {stokSetelah}
                        </span>
                      </div>
                      {stokSetelah !== null && stokSetelah < 0 && (
                        <p className="text-red-600 text-xs mt-1">Stok tidak mencukupi!</p>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                    disabled={loading || (stokSetelah !== null && stokSetelah < 0)}
                  >
                    {loading ? "Menyimpan..." : "Simpan Penyesuaian"}
                  </Button>
                </>
              )}

              {form.jenis === "hapus" && selectedBarang && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border-2 bg-red-50 border-red-300">
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-1">
                      <Trash2 className="h-4 w-4" /> Konfirmasi Hapus Barang
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      Barang <strong>{selectedBarang.nama}</strong> ({selectedBarang.kode}) akan dihapus dari sistem.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Stok saat ini: {selectedBarang.stok}</p>
                  </div>
                  {!confirmHapus ? (
                    <Button
                      type="button"
                      className="w-full bg-red-600 hover:bg-red-700"
                      size="lg"
                      onClick={() => setConfirmHapus(true)}
                    >
                      Lanjutkan Hapus
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-center text-red-600 font-medium">Yakin ingin menghapus barang ini?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={() => setConfirmHapus(false)}>
                          Batal
                        </Button>
                        <Button
                          type="button"
                          className="bg-red-600 hover:bg-red-700"
                          disabled={loading}
                          onClick={handleHapusBarang}
                        >
                          {loading ? "Menghapus..." : "Ya, Hapus"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Riwayat Penyesuaian
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Belum ada riwayat penyesuaian</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {history.map((p) => (
                  <div key={p.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{p.barang.nama}</p>
                        <p className="text-xs text-gray-500">{p.barang.kode}</p>
                        <p className="text-xs text-gray-500 mt-1">{p.alasan}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.jenis === "masuk"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {p.jenis === "masuk" ? `+${p.qty}` : `-${p.qty}`}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(p.tanggal), "dd/MM/yy HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
