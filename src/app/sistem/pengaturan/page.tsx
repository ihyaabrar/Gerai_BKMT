"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

export default function PengaturanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    namaToko: "Gerai BKMT",
    alamatToko: "",
    teleponToko: "",
    prefixTransaksi: "TRX",
    diskonMember: "5",
    persenNasabah: "30",
    persenPengelola: "70",
  });

  useEffect(() => {
    fetchPengaturan();
  }, []);

  const fetchPengaturan = async () => {
    try {
      const res = await fetch("/api/pengaturan");
      const data = await res.json();
      setForm({
        namaToko: data.namaToko || "Gerai BKMT",
        alamatToko: data.alamatToko || "",
        teleponToko: data.teleponToko || "",
        prefixTransaksi: data.prefixTransaksi || "TRX",
        diskonMember: String(data.diskonMember ?? 5),
        persenNasabah: String(data.persenNasabah ?? 30),
        persenPengelola: String(data.persenPengelola ?? 70),
      });
    } catch {
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    // Auto-sync nasabah + pengelola so they always sum to 100
    if (field === "persenNasabah") {
      const n = parseFloat(value) || 0;
      setForm((f) => ({ ...f, persenNasabah: value, persenPengelola: String(100 - n) }));
      return;
    }
    if (field === "persenPengelola") {
      const p = parseFloat(value) || 0;
      setForm((f) => ({ ...f, persenPengelola: value, persenNasabah: String(100 - p) }));
      return;
    }
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const n = parseFloat(form.persenNasabah);
    const p = parseFloat(form.persenPengelola);
    if (n + p !== 100) {
      toast.error("Persentase nasabah + pengelola harus 100%");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaToko: form.namaToko,
          alamatToko: form.alamatToko,
          teleponToko: form.teleponToko,
          prefixTransaksi: form.prefixTransaksi,
          diskonMember: parseFloat(form.diskonMember),
          persenNasabah: n,
          persenPengelola: p,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("Pengaturan berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const totalPersen = parseFloat(form.persenNasabah || "0") + parseFloat(form.persenPengelola || "0");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-gray-500">Konfigurasi sistem</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pengaturan Toko
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Toko</label>
              <Input
                required
                value={form.namaToko}
                onChange={(e) => handleChange("namaToko", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Alamat Toko</label>
              <Input
                value={form.alamatToko}
                onChange={(e) => handleChange("alamatToko", e.target.value)}
                placeholder="Alamat lengkap"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Telepon Toko</label>
              <Input
                value={form.teleponToko}
                onChange={(e) => handleChange("teleponToko", e.target.value)}
                placeholder="08xx"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Prefix Nomor Transaksi</label>
              <Input
                required
                value={form.prefixTransaksi}
                onChange={(e) => handleChange("prefixTransaksi", e.target.value)}
                placeholder="TRX"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Diskon Member (%)</label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                value={form.diskonMember}
                onChange={(e) => handleChange("diskonMember", e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Persentase Nasabah (%)</label>
                <Input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={form.persenNasabah}
                  onChange={(e) => handleChange("persenNasabah", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Persentase Pengelola (%)</label>
                <Input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={form.persenPengelola}
                  onChange={(e) => handleChange("persenPengelola", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className={`p-3 rounded-lg text-sm font-medium ${
              totalPersen === 100
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              Total persentase: {totalPersen}% {totalPersen === 100 ? "✓" : `(harus 100%)`}
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
              disabled={saving || totalPersen !== 100}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
