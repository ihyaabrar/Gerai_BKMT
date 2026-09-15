"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Users, Search, Edit, Trash2, CalendarClock } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";
import { labelPeriode, periodeBerikutnya, periodeDari } from "@/lib/keuangan";
import { toast } from "sonner";

interface PerubahanTertunda {
  berlakuMulai: string;
  label: string;
  jumlah: number;
  aktif: boolean;
}

interface Nasabah {
  id: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  jumlahInvestasi: number;
  persentase: number;
  aktif: boolean;
  /** Modal yang ikut dibagi bulan ini (0 bila baru bergabung). */
  modalBulanIni: number;
  perubahanTertunda: PerubahanTertunda | null;
}

/** Pratinjau distribusi bulan berjalan dari /api/distribusi. */
interface PratinjauBagiHasil {
  labaKotor: number;
  labaDibagi?: number;
  persenNasabah: number;
  bagianNasabah: number;
  detail: { nasabahId: string; bagian: number }[];
}

type CaraUbahModal = "berikutnya" | "koreksi";

export default function NasabahPage() {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([]);
  const [pratinjau, setPratinjau] = useState<PratinjauBagiHasil | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [modalAwal, setModalAwal] = useState(0);
  const [caraUbah, setCaraUbah] = useState<CaraUbahModal>("berikutnya");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nama: "", telepon: "", alamat: "", jumlahInvestasi: "" });
  const [hapus, setHapus] = useState<Nasabah | null>(null);
  const [menghapus, setMenghapus] = useState(false);

  // Perubahan yang dicatat hari ini mulai dihitung bulan depan (kalender WIB).
  const periodeIni = periodeDari(new Date());
  const labelBulanIni = labelPeriode(periodeIni);
  const labelBulanDepan = labelPeriode(periodeBerikutnya(periodeIni));

  useEffect(() => {
    fetchNasabah();
    fetchLaba();
  }, []);

  const fetchNasabah = async () => {
    try {
      const res = await fetch("/api/nasabah");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNasabahList(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Gagal memuat data nasabah");
    }
  };

  // Angka diambil dari perhitungan distribusi yang sama dengan halaman
  // Distribusi Laba. Sebelumnya halaman ini mengalikan laba dengan 0,3 yang
  // ditulis mati — salah begitu persentase di Pengaturan diubah, dan tidak
  // ikut aturan bulan rugi maupun pembulatan rupiah.
  const fetchLaba = async () => {
    try {
      const res = await fetch("/api/distribusi");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.distribusi) setPratinjau(data.distribusi);
    } catch {
      // Kartu ringkasan tetap tampil dengan angka nol.
    }
  };

  const muatUlang = () => {
    fetchNasabah();
    fetchLaba();
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ nama: "", telepon: "", alamat: "", jumlahInvestasi: "" });
    setShowForm(true);
  };

  const openEdit = (n: Nasabah) => {
    setEditId(n.id);
    setModalAwal(n.jumlahInvestasi);
    setCaraUbah("berikutnya");
    setForm({
      nama: n.nama,
      telepon: n.telepon || "",
      alamat: n.alamat || "",
      jumlahInvestasi: String(n.jumlahInvestasi),
    });
    setShowForm(true);
  };

  const modalDiubah = editId !== null && Number(form.jumlahInvestasi) !== modalAwal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const jumlahInvestasi = parseFloat(form.jumlahInvestasi);
      const res = await fetch("/api/nasabah", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editId
            ? { id: editId, ...form, jumlahInvestasi, koreksi: caraUbah === "koreksi" }
            : { ...form, jumlahInvestasi }
        ),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan nasabah");
        return;
      }

      if (!editId) {
        toast.success(`Nasabah ditambahkan. Modalnya mulai dihitung ${data?.labelBerlaku ?? labelBulanDepan}.`);
      } else if (data?.koreksi) {
        toast.success("Modal dikoreksi, termasuk untuk bulan yang belum ditutup.");
      } else if (data?.labelBerlaku) {
        toast.success(`Perubahan modal berlaku mulai ${data.labelBerlaku}.`);
      } else {
        toast.success("Data nasabah diperbarui");
      }
      setShowForm(false);
      muatUlang();
    } catch {
      toast.error("Gagal menyimpan nasabah");
    } finally {
      setLoading(false);
    }
  };

  const jalankanHapus = async (mode: "berhenti" | "salah-input") => {
    if (!hapus || menghapus) return;
    setMenghapus(true);
    try {
      const res = await fetch(`/api/nasabah?id=${hapus.id}&mode=${mode}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal menghapus nasabah");
        return;
      }
      toast.success(
        mode === "salah-input"
          ? `${hapus.nama} dihapus dari semua bulan yang belum ditutup.`
          : `${hapus.nama} berhenti. Masih mendapat bagian ${labelBulanIni}, tidak lagi mulai ${data?.labelBerlaku ?? labelBulanDepan}.`
      );
      setHapus(null);
      muatUlang();
    } catch {
      toast.error("Gagal menghapus nasabah");
    } finally {
      setMenghapus(false);
    }
  };

  const filtered = nasabahList.filter(
    (n) =>
      n.nama.toLowerCase().includes(search.toLowerCase()) ||
      (n.telepon || "").includes(search)
  );

  const totalInvestasi = nasabahList.reduce((sum, n) => sum + n.jumlahInvestasi, 0);
  const totalModalBulanIni = nasabahList.reduce((sum, n) => sum + n.modalBulanIni, 0);

  // Laba yang benar-benar dibagi: sudah dikurangi barang rusak/hilang.
  const totalLabaBulanIni = pratinjau?.labaDibagi ?? pratinjau?.labaKotor ?? 0;
  const bagianNasabahTotal = pratinjau?.bagianNasabah ?? 0;
  const bagianPer = new Map((pratinjau?.detail ?? []).map((d) => [d.nasabahId, d.bagian]));

  const keteranganTertunda = (n: Nasabah): string | null => {
    const t = n.perubahanTertunda;
    if (!t) return null;
    if (!t.aktif) return `Berhenti mulai ${t.label}`;
    if (n.modalBulanIni === 0) return `Mulai dihitung ${t.label}`;
    return `Jadi ${formatRupiah(t.jumlah)} mulai ${t.label}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Nasabah (Pemodal)</h1>
          <p className="text-slate-500">Orang yang menanam modal di gerai dan besar modalnya</p>
        </div>
        <Button onClick={openAdd}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah Nasabah
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Total Investasi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600">{formatRupiah(totalInvestasi)}</p>
            {totalModalBulanIni !== totalInvestasi && (
              <p className="text-xs text-slate-400 mt-1">
                Ikut dibagi {labelBulanIni}: {formatRupiah(totalModalBulanIni)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Laba Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-600">{formatRupiah(totalLabaBulanIni)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Bagian Nasabah ({pratinjau?.persenNasabah ?? "–"}%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-600">{formatRupiah(bagianNasabahTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-card border border-sky-200 bg-sky-50/60 px-4 py-3 flex gap-3">
        <CalendarClock className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-sm text-sky-900 leading-relaxed">
          Nasabah baru, tambahan atau pengurangan modal, dan nasabah yang berhenti{" "}
          <strong>berlaku mulai bulan berikutnya</strong>. Perubahan yang dicatat hari ini
          mulai dihitung pada pembagian <strong>{labelBulanDepan}</strong>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Nasabah
            </CardTitle>
            <div className="relative w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input aria-label="Cari nasabah..."
                placeholder="Cari nasabah..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{search ? "Nasabah tidak ditemukan" : "Belum ada nasabah"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nama</th>
                    <th className="text-left py-3 px-4">Telepon</th>
                    <th className="text-right py-3 px-4">Investasi</th>
                    <th className="text-center py-3 px-4">Porsi {labelBulanIni}</th>
                    <th className="text-right py-3 px-4">Bagi Hasil Bulan Ini</th>
                    <th className="text-center py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((n) => {
                    const porsi =
                      totalModalBulanIni > 0 ? (n.modalBulanIni / totalModalBulanIni) * 100 : 0;
                    const bagiHasil = bagianPer.get(n.id) ?? 0;
                    const tertunda = keteranganTertunda(n);
                    return (
                      <tr key={n.id} className="border-b hover:bg-surface-muted">
                        <td className="py-3 px-4">
                          <p className="font-medium">{n.nama}</p>
                          <p className="text-xs text-slate-400">{n.alamat || "-"}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{n.telepon || "-"}</td>
                        <td className="py-3 px-4 text-right">
                          <p className="font-semibold">{formatRupiah(n.modalBulanIni || n.jumlahInvestasi)}</p>
                          {tertunda && (
                            <p className="text-xs text-sky-700 mt-0.5 whitespace-nowrap">{tertunda}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              n.modalBulanIni > 0 ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {n.modalBulanIni > 0 ? `${porsi.toFixed(1)}%` : "Belum"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-brand-600 font-medium">
                          {formatRupiah(bagiHasil)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <Button aria-label={`Edit ${n.nama}`} variant="ghost" size="sm" onClick={() => openEdit(n)}>
                              <Edit className="h-4 w-4 text-brand-600" />
                            </Button>
                            <Button aria-label={`Hapus ${n.nama}`} variant="ghost" size="sm" onClick={() => setHapus(n)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md" onClose={() => setShowForm(false)}>
          <DialogHeader>
            <DialogTitle>{editId ? "Ubah Data Nasabah" : "Tambah Nasabah Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="nama-lengkap">Nama Lengkap</label>
              <Input id="nama-lengkap" required value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama nasabah" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="telepon">Telepon</label>
              <Input id="telepon" value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                placeholder="08xx" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="alamat">Alamat</label>
              <Input id="alamat" value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Alamat lengkap" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="jumlah-investasi">Jumlah Investasi</label>
              <Input id="jumlah-investasi" required type="number" min="1" value={form.jumlahInvestasi}
                onChange={(e) => setForm({ ...form, jumlahInvestasi: e.target.value })}
                placeholder="0" className="mt-1" />
              {!editId && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Modal mulai dihitung pada pembagian {labelBulanDepan}.
                </p>
              )}
            </div>

            {modalDiubah && (
              <fieldset className="rounded-md border border-border p-3 space-y-2.5">
                <legend className="px-1 text-sm font-medium text-slate-700">Perubahan modal ini</legend>
                <label className="flex gap-2.5 text-sm cursor-pointer">
                  <input type="radio" name="cara-ubah" className="mt-1"
                    checked={caraUbah === "berikutnya"} onChange={() => setCaraUbah("berikutnya")} />
                  <span>
                    <span className="font-medium">Tambah atau kurangi modal</span>
                    <span className="block text-xs text-slate-500">Berlaku mulai {labelBulanDepan}.</span>
                  </span>
                </label>
                <label className="flex gap-2.5 text-sm cursor-pointer">
                  <input type="radio" name="cara-ubah" className="mt-1"
                    checked={caraUbah === "koreksi"} onChange={() => setCaraUbah("koreksi")} />
                  <span>
                    <span className="font-medium">Koreksi salah ketik</span>
                    <span className="block text-xs text-slate-500">
                      Angka sebelumnya keliru. Ikut mengubah bulan yang belum ditutup.
                    </span>
                  </span>
                </label>
              </fieldset>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Simpan Nasabah"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={hapus !== null} onOpenChange={(buka) => !buka && setHapus(null)}>
        <DialogContent className="max-w-md" onClose={() => setHapus(null)}>
          <DialogHeader>
            <DialogTitle>Hapus {hapus?.nama}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <button
              type="button"
              disabled={menghapus}
              onClick={() => jalankanHapus("berhenti")}
              className="w-full text-left rounded-md border border-border p-3 hover:border-brand-300 hover:bg-surface-muted transition-colors disabled:opacity-60"
            >
              <p className="font-medium text-slate-900">Berhenti menjadi nasabah</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Modalnya masih bekerja sampai hari ini, jadi masih mendapat bagian {labelBulanIni}.
                Tidak lagi dihitung mulai {labelBulanDepan}.
              </p>
            </button>
            <button
              type="button"
              disabled={menghapus}
              onClick={() => jalankanHapus("salah-input")}
              className="w-full text-left rounded-md border border-rose-200 p-3 hover:bg-rose-50 transition-colors disabled:opacity-60"
            >
              <p className="font-medium text-rose-700">Salah input / data contoh</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Orang ini sebenarnya bukan nasabah. Dihapus dari semua bulan yang belum ditutup.
                Hanya bisa bila belum pernah tercatat menerima bagian.
              </p>
            </button>
            <Button type="button" variant="outline" className="w-full" onClick={() => setHapus(null)}>
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
