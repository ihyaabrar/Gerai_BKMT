"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, CalendarDays, Search, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

interface Agenda {
  id: string;
  judul: string;
  deskripsi: string | null;
  tanggal: string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  lokasi: string | null;
  kategori: string | null;
  status: string;
}

const LABEL_STATUS: Record<string, string> = {
  terjadwal: "Terjadwal",
  berlangsung: "Berlangsung",
  selesai: "Selesai",
  batal: "Dibatalkan",
};

const VARIAN_STATUS: Record<string, "default" | "info" | "secondary" | "destructive"> = {
  terjadwal: "info",
  berlangsung: "default",
  selesai: "secondary",
  batal: "destructive",
};

const FORM_KOSONG = {
  judul: "",
  deskripsi: "",
  tanggal: "",
  waktuMulai: "",
  waktuSelesai: "",
  lokasi: "",
  kategori: "",
  status: "terjadwal",
};

export default function AdminAgendaPage() {
  const { konfirmasi, dialog } = useConfirm();
  const [list, setList] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState("");
  const [saring, setSaring] = useState("semua");
  const [terbuka, setTerbuka] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_KOSONG);
  const [menyimpan, setMenyimpan] = useState(false);

  const ambil = () => {
    fetch("/api/admin/agenda")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => setList(res.data || []))
      .catch(() => toast.error("Gagal memuat agenda"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    ambil();
  }, []);

  const bukaTambah = () => {
    setEditId(null);
    setForm(FORM_KOSONG);
    setTerbuka(true);
  };

  const bukaEdit = (a: Agenda) => {
    setEditId(a.id);
    setForm({
      judul: a.judul,
      deskripsi: a.deskripsi ?? "",
      // input type="date" butuh format YYYY-MM-DD
      tanggal: a.tanggal.slice(0, 10),
      waktuMulai: a.waktuMulai ?? "",
      waktuSelesai: a.waktuSelesai ?? "",
      lokasi: a.lokasi ?? "",
      kategori: a.kategori ?? "",
      status: a.status,
    });
    setTerbuka(true);
  };

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (menyimpan) return;
    setMenyimpan(true);
    try {
      const res = await fetch("/api/admin/agenda", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(editId ? { id: editId } : {}), ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan agenda");
        return;
      }
      toast.success(editId ? "Agenda diperbarui" : "Agenda ditambahkan");
      setTerbuka(false);
      ambil();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = (a: Agenda) => {
    konfirmasi({
      judul: "Hapus agenda?",
      pesan: (
        <>
          <strong>{a.judul}</strong> akan dihapus permanen dari jadwal kegiatan.
        </>
      ),
      aksi: async () => {
        const res = await fetch(`/api/admin/agenda?id=${a.id}`, { method: "DELETE" });
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          toast.error(d?.error || "Gagal menghapus agenda");
          return;
        }
        toast.success("Agenda dihapus");
        ambil();
      },
    });
  };

  const tab = useMemo(() => {
    const hitung = (s: string) => list.filter((a) => a.status === s).length;
    return [
      { id: "semua", label: "Semua", jumlah: list.length },
      { id: "terjadwal", label: "Terjadwal", jumlah: hitung("terjadwal") },
      { id: "berlangsung", label: "Berlangsung", jumlah: hitung("berlangsung") },
      { id: "selesai", label: "Selesai", jumlah: hitung("selesai") },
      { id: "batal", label: "Dibatalkan", jumlah: hitung("batal") },
    ].filter((t) => t.id === "semua" || t.jumlah > 0);
  }, [list]);

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    let hasil = list;
    if (saring !== "semua") hasil = hasil.filter((a) => a.status === saring);
    if (q) {
      hasil = hasil.filter(
        (a) =>
          a.judul.toLowerCase().includes(q) ||
          (a.lokasi ?? "").toLowerCase().includes(q)
      );
    }
    return hasil;
  }, [list, saring, cari]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Agenda Kegiatan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Jadwal kegiatan yang tampil di halaman publik.
          </p>
        </div>
        <Button onClick={bukaTambah} className="shrink-0">
          <Plus className="h-4 w-4" /> Tambah Agenda
        </Button>
      </div>

      <Card>
        <CardContent className="p-5 pt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {tab.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSaring(t.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  saring === t.id
                    ? "bg-brand-600 text-white"
                    : "bg-surface-sunken text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                )}
              >
                {t.label} ({t.jumlah})
              </button>
            ))}
            <div className="relative ml-auto w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                aria-label="Cari agenda"
                placeholder="Cari judul atau lokasi..."
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <TableSkeleton cols={4} />
          ) : tersaring.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {cari || saring !== "semua"
                  ? "Tidak ada agenda yang cocok"
                  : "Belum ada agenda kegiatan"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {tersaring.map((a) => {
                const tgl = new Date(a.tanggal);
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-4 py-3.5">
                    {/* Kotak tanggal */}
                    <div className="w-14 shrink-0 rounded-lg border border-border bg-surface-sunken text-center py-1.5">
                      <p className="text-xs uppercase text-slate-500 tracking-wide">
                        {format(tgl, "MMM", { locale: localeId })}
                      </p>
                      <p className="text-lg font-bold text-slate-900 leading-tight">
                        {format(tgl, "d")}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{a.judul}</p>
                        <Badge variant={VARIAN_STATUS[a.status] ?? "secondary"}>
                          {LABEL_STATUS[a.status] ?? a.status}
                        </Badge>
                        {a.kategori && <Badge variant="outline">{a.kategori}</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        {(a.waktuMulai || a.waktuSelesai) && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-300" />
                            {a.waktuMulai ?? "—"}
                            {a.waktuSelesai ? ` – ${a.waktuSelesai}` : ""}
                          </span>
                        )}
                        {a.lokasi && (
                          <span className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            <span className="truncate">{a.lokasi}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        aria-label={`Edit ${a.judul}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => bukaEdit(a)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        aria-label={`Hapus ${a.judul}`}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => hapus(a)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={terbuka} onOpenChange={setTerbuka}>
        <DialogContent onClose={() => setTerbuka(false)}>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Agenda" : "Tambah Agenda"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={simpan} className="space-y-4">
            <div>
              <label htmlFor="a-judul" className="block text-sm font-medium text-slate-700">
                Judul Kegiatan <span className="text-red-500">*</span>
              </label>
              <Input
                id="a-judul"
                required
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label
                  htmlFor="a-tanggal"
                  className="block text-sm font-medium text-slate-700"
                >
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <Input
                  id="a-tanggal"
                  type="date"
                  required
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label
                  htmlFor="a-status"
                  className="block text-sm font-medium text-slate-700"
                >
                  Status
                </label>
                <Select
                  id="a-status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1.5"
                >
                  <option value="terjadwal">Terjadwal</option>
                  <option value="berlangsung">Berlangsung</option>
                  <option value="selesai">Selesai</option>
                  <option value="batal">Dibatalkan</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="a-mulai"
                  className="block text-sm font-medium text-slate-700"
                >
                  Waktu Mulai
                </label>
                <Input
                  id="a-mulai"
                  type="time"
                  value={form.waktuMulai}
                  onChange={(e) => setForm({ ...form, waktuMulai: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label
                  htmlFor="a-selesai"
                  className="block text-sm font-medium text-slate-700"
                >
                  Waktu Selesai
                </label>
                <Input
                  id="a-selesai"
                  type="time"
                  value={form.waktuSelesai}
                  onChange={(e) => setForm({ ...form, waktuSelesai: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="a-lokasi"
                  className="block text-sm font-medium text-slate-700"
                >
                  Lokasi
                </label>
                <Input
                  id="a-lokasi"
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                  placeholder="Masjid Agung Kubu Raya"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label
                  htmlFor="a-kategori"
                  className="block text-sm font-medium text-slate-700"
                >
                  Kategori
                </label>
                <Input
                  id="a-kategori"
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  placeholder="Pengajian, Pelatihan..."
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="a-deskripsi"
                className="block text-sm font-medium text-slate-700"
              >
                Deskripsi
              </label>
              <textarea
                id="a-deskripsi"
                rows={3}
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                className="mt-1.5 flex w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <Button type="submit" disabled={menyimpan} className="w-full">
              {menyimpan ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Agenda"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  );
}
