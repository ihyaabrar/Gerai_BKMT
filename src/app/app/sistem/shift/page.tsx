"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, PlayCircle, StopCircle, User } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { useAuthStore } from "@/store/auth";

interface Shift {
  id: string;
  jamBuka: string;
  jamTutup: string | null;
  saldoAwal: number;
  saldoAkhir: number | null;
  totalPenjualan: number | null;
  catatan: string | null;
  user: {
    nama: string;
  };
}

export default function ShiftPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [openBuka, setOpenBuka] = useState(false);
  const [openTutup, setOpenTutup] = useState(false);
  const [formBuka, setFormBuka] = useState({
    saldoAwal: "",
  });
  const [formTutup, setFormTutup] = useState({
    saldoAkhir: "",
    catatan: "",
  });
  
  const { user } = useAuthStore();

  const fetchShifts = async () => {
    try {
      const res = await fetch("/api/shift");
      const data = await res.json();
      setShifts(data);

      const active = data.find((s: Shift) => s.jamTutup === null);
      setActiveShift(active || null);
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleBukaShift = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("User tidak ditemukan, silakan login ulang");
      return;
    }
    
    try {
      const res = await fetch("/api/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buka",
          userId: user.id,
          saldoAwal: formBuka.saldoAwal,
        }),
      });

      if (res.ok) {
        setOpenBuka(false);
        setFormBuka({ saldoAwal: "" });
        fetchShifts();
        toast.success("Shift berhasil dibuka");
      } else {
        const error = await res.json();
        toast.error(error.error || "Gagal membuka shift");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleTutupShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tutup",
          saldoAkhir: formTutup.saldoAkhir,
          catatan: formTutup.catatan,
        }),
      });

      if (res.ok) {
        setOpenTutup(false);
        setFormTutup({ saldoAkhir: "", catatan: "" });
        fetchShifts();
        toast.success("Shift berhasil ditutup");
      } else {
        const error = await res.json();
        toast.error(error.error || "Gagal menutup shift");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shift Kasir</h1>
          <p className="text-gray-500">Manajemen shift dan rekap kasir</p>
        </div>
        <div className="flex gap-2">
          {!activeShift ? (
            <Button
              onClick={() => setOpenBuka(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Buka Shift
            </Button>
          ) : (
            <Button
              onClick={() => setOpenTutup(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Tutup Shift
            </Button>
          )}
        </div>
      </div>

      {activeShift && (
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Shift Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-90">Kasir</p>
                <p className="text-xl font-bold">{activeShift.user.nama}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Waktu Buka</p>
                <p className="text-xl font-bold">
                  {format(new Date(activeShift.jamBuka), "HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-90">Saldo Awal</p>
                <p className="text-xl font-bold">
                  {formatRupiah(activeShift.saldoAwal)}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-90">Durasi</p>
                <p className="text-xl font-bold">
                  {Math.floor(
                    (new Date().getTime() - new Date(activeShift.jamBuka).getTime()) /
                      (1000 * 60)
                  )}{" "}
                  menit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Riwayat Shift
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : shifts.filter((s) => s.jamTutup).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada riwayat shift
            </div>
          ) : (
            <div className="space-y-4">
              {shifts
                .filter((s) => s.jamTutup)
                .map((s) => {
                  const durasi = Math.floor(
                    (new Date(s.jamTutup!).getTime() -
                      new Date(s.jamBuka).getTime()) /
                      (1000 * 60)
                  );
                  const selisih = (s.saldoAkhir || 0) - s.saldoAwal - (s.totalPenjualan || 0);

                  return (
                    <div key={s.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{s.user.nama}</h3>
                            <p className="text-sm text-gray-500">
                              {format(new Date(s.jamBuka), "dd/MM/yyyy HH:mm")} -{" "}
                              {format(new Date(s.jamTutup!), "HH:mm")} ({durasi} menit)
                            </p>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Saldo Awal</p>
                                <p className="font-semibold">
                                  {formatRupiah(s.saldoAwal)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Total Penjualan</p>
                                <p className="font-semibold text-green-600">
                                  {formatRupiah(s.totalPenjualan || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Saldo Akhir</p>
                                <p className="font-semibold">
                                  {formatRupiah(s.saldoAkhir || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Selisih</p>
                                <p
                                  className={`font-semibold ${
                                    selisih === 0
                                      ? "text-green-600"
                                      : selisih > 0
                                      ? "text-blue-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {formatRupiah(selisih)}
                                </p>
                              </div>
                            </div>
                            {s.catatan && (
                              <p className="text-sm mt-2 text-gray-600">
                                Catatan: {s.catatan}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openBuka} onOpenChange={setOpenBuka}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka Shift</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBukaShift} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Saldo Awal Kas</label>
              <Input
                type="number"
                value={formBuka.saldoAwal}
                onChange={(e) => setFormBuka({ saldoAwal: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Buka Shift
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openTutup} onOpenChange={setOpenTutup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Shift</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTutupShift} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Saldo Akhir Kas</label>
              <Input
                type="number"
                value={formTutup.saldoAkhir}
                onChange={(e) => setFormTutup({ ...formTutup, saldoAkhir: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Catatan (Opsional)</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                value={formTutup.catatan}
                onChange={(e) => setFormTutup({ ...formTutup, catatan: e.target.value })}
                placeholder="Catatan shift..."
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
              Tutup Shift
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
