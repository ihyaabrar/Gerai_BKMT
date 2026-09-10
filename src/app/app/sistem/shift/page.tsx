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
import { TableSkeleton } from "@/components/ui/skeleton";

interface Shift {
  id: string;
  jamBuka: string;
  jamTutup: string | null;
  saldoAwal: number;
  saldoAkhir: number | null;
  totalPenjualan: number;
  jumlahTransaksi: number;
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
  const [submitting, setSubmitting] = useState(false);
  

  const fetchShifts = async () => {
    try {
      const res = await fetch("/api/shift");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShifts(data.data ?? []);
      setActiveShift(data.shiftAktif ?? null);
    } catch {
      toast.error("Gagal memuat data shift");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleBukaShift = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);
    try {
      // userId tidak lagi dikirim dari client — server memakai sesi login.
      const res = await fetch("/api/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buka",
          saldoAwal: Number(formBuka.saldoAwal),
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleTutupShift = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tutup",
          saldoAkhir: Number(formTutup.saldoAkhir),
          catatan: formTutup.catatan,
        }),
      });

      if (res.ok) {
        const hasil = await res.json();
        setOpenTutup(false);
        setFormTutup({ saldoAkhir: "", catatan: "" });
        fetchShifts();
        toast.success(
          hasil.selisih === 0
            ? "Shift ditutup — kas sesuai"
            : `Shift ditutup — selisih kas ${formatRupiah(hasil.selisih)}`
        );
      } else {
        const error = await res.json();
        toast.error(error.error || "Gagal menutup shift");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Shift Kasir</h1>
          <p className="text-slate-500">Manajemen shift dan rekap kasir</p>
        </div>
        <div className="flex gap-2">
          {!activeShift ? (
            <Button
              onClick={() => setOpenBuka(true)}
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
            <TableSkeleton cols={4} />
          ) : shifts.filter((s) => s.jamTutup).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
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
                  const selisih =
                    (s.saldoAkhir || 0) - s.saldoAwal - (s.totalPenjualan || 0);

                  return (
                    <div key={s.id} className="border rounded-lg p-4">
                      <div className="flex flex-wrap gap-3 justify-between items-start">
                        <div className="flex gap-4">
                          <div className="bg-brand-100 p-3 rounded-lg">
                            <User className="h-6 w-6 text-brand-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{s.user.nama}</h3>
                            <p className="text-sm text-slate-500">
                              {format(new Date(s.jamBuka), "dd/MM/yyyy HH:mm")} -{" "}
                              {format(new Date(s.jamTutup!), "HH:mm")} ({durasi} menit)
                            </p>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-slate-500">Saldo Awal</p>
                                <p className="font-semibold">
                                  {formatRupiah(s.saldoAwal)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">
                                  Total Penjualan ({s.jumlahTransaksi ?? 0} transaksi)
                                </p>
                                <p className="font-semibold text-green-600">
                                  {formatRupiah(s.totalPenjualan || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Saldo Akhir</p>
                                <p className="font-semibold">
                                  {formatRupiah(s.saldoAkhir || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Selisih</p>
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
                              <p className="text-sm mt-2 text-slate-600">
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
              <label className="text-sm font-medium" htmlFor="saldo-awal-kas">Saldo Awal Kas</label>
              <Input id="saldo-awal-kas"
                type="number"
                value={formBuka.saldoAwal}
                onChange={(e) => setFormBuka({ saldoAwal: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Memproses..." : "Buka Shift"}
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
              <label className="text-sm font-medium" htmlFor="saldo-akhir-kas">Saldo Akhir Kas</label>
              <Input id="saldo-akhir-kas"
                type="number"
                value={formTutup.saldoAkhir}
                onChange={(e) => setFormTutup({ ...formTutup, saldoAkhir: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="catatan-opsional">Catatan (Opsional)</label>
              <textarea id="catatan-opsional"
                className="w-full border rounded-lg px-3 py-2"
                value={formTutup.catatan}
                onChange={(e) => setFormTutup({ ...formTutup, catatan: e.target.value })}
                placeholder="Catatan shift..."
                rows={3}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {submitting ? "Memproses..." : "Tutup Shift"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
