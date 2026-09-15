"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, PlayCircle, StopCircle, User } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/skeleton";
import { DialogBukaKasir } from "@/components/DialogBukaKasir";
import { InputRupiah } from "@/components/ui/input-rupiah";

interface Shift {
  id: string;
  jamBuka: string;
  jamTutup: string | null;
  saldoAwal: number;
  saldoAkhir: number | null;
  totalPenjualan: number;
  penjualanTunai: number;
  penjualanNonTunai: number;
  /** Uang retur pembeli yang dikembalikan tunai dari laci. */
  refundTunai?: number;
  /** Dari server: tersimpan saat shift ditutup, atau dihitung untuk shift lama. */
  selisih: number | null;
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
  const [formTutup, setFormTutup] = useState<{ saldoAkhir: number | null; catatan: string }>({
    saldoAkhir: null,
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

  const handleTutupShift = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting || formTutup.saldoAkhir === null) return;
    setSubmitting(true);
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
        const hasil = await res.json();
        setOpenTutup(false);
        setFormTutup({ saldoAkhir: null, catatan: "" });
        fetchShifts();
        toast.success(
          hasil.selisih === 0
            ? "Kasir ditutup — uang di laci cocok"
            : hasil.selisih > 0
            ? `Kasir ditutup — uang di laci lebih ${formatRupiah(hasil.selisih)}`
            : `Kasir ditutup — uang di laci kurang ${formatRupiah(-hasil.selisih)}`
        );
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || "Kasir gagal ditutup. Coba lagi.");
      }
    } catch {
      toast.error("Koneksi terputus. Periksa internet, lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Buka / Tutup Kasir</h1>
          <p className="text-sm text-slate-500 mt-1">
            Buka kasir sebelum berjualan, tutup setelah selesai dan uang di laci dihitung.
          </p>
        </div>
        <div className="flex gap-2">
          {!activeShift ? (
            <Button
              onClick={() => setOpenBuka(true)}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Buka Kasir
            </Button>
          ) : (
            <Button
              onClick={() => setOpenTutup(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Tutup Kasir
            </Button>
          )}
        </div>
      </div>

      {activeShift && (
        <Card className="border-brand-200 bg-brand-50/60">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
              </span>
              Kasir Sedang Buka
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white border border-brand-100 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">Kasir</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">{activeShift.user.nama}</p>
              </div>
              <div className="rounded-xl bg-white border border-brand-100 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">Dibuka</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">
                  {/* Tanggal ikut ditampilkan: tanpa itu, shift kemarin yang
                      lupa ditutup terlihat seperti shift yang dibuka pagi ini. */}
                  {format(new Date(activeShift.jamBuka), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <div className="rounded-xl bg-white border border-brand-100 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">Uang Awal di Laci</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">
                  {formatRupiah(activeShift.saldoAwal)}
                </p>
              </div>
              <div className="rounded-xl bg-white border border-brand-100 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">Lama Buka</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">
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
          <CardTitle className="flex items-center gap-2.5">
            <CardIcon icon={Clock} nada="brand" />
            Riwayat Buka / Tutup
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton cols={4} />
          ) : shifts.filter((s) => s.jamTutup).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Belum ada riwayat
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
                  // Angka dari server: dibekukan saat shift ditutup, sehingga
                  // pembatalan transaksi di hari lain tidak mengubah selisih
                  // yang sudah dicatat kasirnya.
                  const tunai = s.penjualanTunai ?? 0;
                  const nonTunai = s.penjualanNonTunai ?? 0;
                  const refundTunai = s.refundTunai ?? 0;
                  const selisih = s.selisih ?? 0;

                  return (
                    <div key={s.id} className="border rounded-lg p-4">
                      <div className="flex flex-wrap gap-3 justify-between items-start">
                        <div className="flex gap-4 min-w-0 flex-1">
                          <div className="hidden sm:flex self-start bg-brand-100 p-3 rounded-lg">
                            <User className="h-6 w-6 text-brand-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-lg">{s.user.nama}</h3>
                            <p className="text-sm text-slate-500">
                              {format(new Date(s.jamBuka), "dd/MM/yyyy HH:mm")} -{" "}
                              {format(new Date(s.jamTutup!), "HH:mm")} ({durasi} menit)
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3">
                              <div>
                                <p className="text-xs text-slate-500">Uang Awal</p>
                                <p className="font-semibold">
                                  {formatRupiah(s.saldoAwal)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">
                                  Penjualan Tunai
                                </p>
                                <p className="font-semibold text-brand-600">
                                  {formatRupiah(tunai)}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {s.jumlahTransaksi ?? 0} transaksi (semua metode)
                                </p>
                                {nonTunai > 0 && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    + {formatRupiah(nonTunai)} non-tunai, tidak
                                    masuk laci
                                  </p>
                                )}
                                {refundTunai > 0 && (
                                  <p className="text-xs text-rose-600 mt-0.5">
                                    − {formatRupiah(refundTunai)} dikembalikan untuk retur
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Uang Akhir (dihitung)</p>
                                <p className="font-semibold">
                                  {formatRupiah(s.saldoAkhir || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">
                                  Selisih
                                </p>
                                <p
                                  className={`font-semibold ${
                                    selisih === 0
                                      ? "text-brand-600"
                                      : selisih > 0
                                      ? "text-sky-600"
                                      : "text-rose-600"
                                  }`}
                                >
                                  {selisih === 0
                                    ? "Cocok"
                                    : selisih > 0
                                    ? `Lebih ${formatRupiah(selisih)}`
                                    : `Kurang ${formatRupiah(-selisih)}`}
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

      <DialogBukaKasir open={openBuka} onOpenChange={setOpenBuka} onBerhasil={fetchShifts} />

      <Dialog open={openTutup} onOpenChange={(v) => !submitting && setOpenTutup(v)}>
        <DialogContent onClose={() => !submitting && setOpenTutup(false)}>
          <DialogHeader>
            <DialogTitle>Tutup Kasir</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTutupShift} className="space-y-4">
            <ol className="text-sm text-slate-600 space-y-1.5 list-decimal pl-5 leading-relaxed">
              <li>Keluarkan dan hitung semua uang tunai di laci.</li>
              <li>Tulis jumlahnya di bawah — apa adanya, walau terasa kurang atau lebih.</li>
              <li>Sistem mencocokkan dengan uang awal dan penjualan tunai.</li>
            </ol>
            <div>
              <label className="text-sm font-medium" htmlFor="saldo-akhir-kas">Uang di laci sekarang</label>
              <InputRupiah
                id="saldo-akhir-kas"
                nilai={formTutup.saldoAkhir}
                onNilai={(v) => setFormTutup({ ...formTutup, saldoAkhir: v })}
                placeholder="0"
                className="mt-1 text-lg h-12"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="catatan-opsional">Catatan (boleh kosong)</label>
              <textarea id="catatan-opsional"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={formTutup.catatan}
                onChange={(e) => setFormTutup({ ...formTutup, catatan: e.target.value })}
                placeholder="Mis. uang kembalian Rp2.000 diberikan dari kantong sendiri"
                rows={3}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || formTutup.saldoAkhir === null}
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
            >
              {submitting ? "Menutup..." : "Tutup Kasir"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
