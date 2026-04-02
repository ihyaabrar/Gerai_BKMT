"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RotateCcw, Plus, Package } from "lucide-react";
import { format } from "date-fns";

interface Retur {
  id: string;
  tanggal: string;
  barang: {
    nama: string;
    kode: string;
  };
  qty: number;
  alasan: string;
  status: string;
}

interface Barang {
  id: string;
  kode: string;
  nama: string;
  hargaBeli: number;
}

export default function ReturPage() {
  const [retur, setRetur] = useState<Retur[]>([]);
  const [barang, setBarang] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    barangId: "",
    qty: "",
    alasan: "",
  });

  const fetchData = async () => {
    try {
      const [returRes, barangRes] = await Promise.all([
        fetch("/api/retur"),
        fetch("/api/barang"),
      ]);

      const [returData, barangData] = await Promise.all([
        returRes.json(),
        barangRes.json(),
      ]);

      setRetur(returData);
      setBarang(barangData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/retur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setOpen(false);
        setForm({
          barangId: "",
          qty: "",
          alasan: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create retur:", error);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/retur", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Retur Barang</h1>
          <p className="text-gray-500">Pengembalian barang rusak/kadaluarsa</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Retur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Daftar Retur
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : retur.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada data retur
            </div>
          ) : (
            <div className="space-y-4">
              {retur.map((r) => (
                <div key={r.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <Package className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {r.barang.kode} - {r.barang.nama}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Tanggal: {format(new Date(r.tanggal), "dd/MM/yyyy HH:mm")}
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Alasan:</span> {r.alasan}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Jumlah:</span> {r.qty} unit
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {r.status === "proses" ? (
                        <div className="space-y-2">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                            Proses
                          </span>
                          <div>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(r.id, "selesai")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Selesai
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          Selesai
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Retur Barang</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Barang</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.barangId}
                onChange={(e) => setForm({ ...form, barangId: e.target.value })}
                required
              >
                <option value="">Pilih Barang</option>
                {barang.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.kode} - {b.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah</label>
              <Input
                type="number"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                placeholder="0"
                min="1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Alasan Retur</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                value={form.alasan}
                onChange={(e) => setForm({ ...form, alasan: e.target.value })}
                placeholder="Barang rusak, kadaluarsa, dll"
                rows={3}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
