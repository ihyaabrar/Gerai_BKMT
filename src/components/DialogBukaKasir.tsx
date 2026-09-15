"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputRupiah } from "@/components/ui/input-rupiah";
import { toast } from "sonner";

/**
 * Buka kasir (shift) dari mana saja — halaman Jualan maupun Buka/Tutup Kasir —
 * supaya kasir tidak perlu mencari menu lain sebelum mulai berjualan.
 */
export function DialogBukaKasir({
  open,
  onOpenChange,
  onBerhasil,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBerhasil: () => void;
}) {
  const [uangAwal, setUangAwal] = useState<number | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const tutup = () => {
    if (menyimpan) return;
    onOpenChange(false);
    setUangAwal(null);
  };

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (menyimpan || uangAwal === null) return;
    setMenyimpan(true);
    try {
      // userId tidak dikirim dari client — server memakai sesi login.
      const res = await fetch("/api/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buka", saldoAwal: uangAwal }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Kasir gagal dibuka. Coba lagi.");
        return;
      }
      toast.success("Kasir dibuka. Selamat berjualan!");
      onOpenChange(false);
      setUangAwal(null);
      onBerhasil();
    } catch {
      toast.error("Koneksi terputus. Periksa internet, lalu coba lagi.");
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : tutup())}>
      <DialogContent onClose={tutup}>
        <DialogHeader>
          <DialogTitle>Buka Kasir</DialogTitle>
        </DialogHeader>
        <form onSubmit={simpan} className="space-y-4">
          <ol className="text-sm text-slate-600 space-y-1.5 list-decimal pl-5 leading-relaxed">
            <li>Hitung semua uang tunai yang ada di laci sebelum mulai.</li>
            <li>Tulis jumlahnya di bawah. Kalau laci kosong, tulis 0.</li>
          </ol>
          <div>
            <label className="text-sm font-medium" htmlFor="uang-awal-laci">
              Uang di laci sekarang
            </label>
            <InputRupiah
              id="uang-awal-laci"
              nilai={uangAwal}
              onNilai={setUangAwal}
              placeholder="0"
              className="mt-1 text-lg h-12"
              autoFocus
              required
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Saat tutup kasir nanti, uang di laci dihitung lagi dan dicocokkan dengan penjualan tunai.
            </p>
          </div>
          <Button type="submit" disabled={menyimpan || uangAwal === null} className="w-full" size="lg">
            {menyimpan ? "Membuka..." : "Buka Kasir"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
