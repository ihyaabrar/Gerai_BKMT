"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, Users, Search, Phone } from "lucide-react";
import { toast } from "sonner";

interface Pengurus {
  id: string;
  nama: string;
  jabatan: string;
  tingkatan: string;
  periode: string | null;
  alamat: string | null;
  nik: string | null;
  fotoUrl: string | null;
  urutan: number;
  aktif: boolean;
}

const LABEL_TINGKATAN: Record<string, string> = {
  PD: "Pimpinan Daerah",
  PC: "Pimpinan Cabang",
  Permata: "Permata BKMT",
};

const PER_HALAMAN = 8;

export default function AdminPengurusPage() {
  const { konfirmasi, dialog } = useConfirm();
  const [list, setList] = useState<Pengurus[]>([]);
  const [loading, setLoading] = useState(true);
  const [tingkatan, setTingkatan] = useState<string>("semua");
  const [cari, setCari] = useState("");
  const [halaman, setHalaman] = useState(1);

  const fetchData = () => {
    fetch("/api/admin/pengurus")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => setList(res.data || []))
      .catch(() => toast.error("Gagal memuat data pengurus"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (id: string, nama: string) => {
    konfirmasi({
      judul: "Hapus pengurus?",
      pesan: (
        <>
          <strong>{nama}</strong> akan dihapus permanen dari daftar pengurus.
        </>
      ),
      aksi: async () => {
        try {
          const res = await fetch(`/api/admin/pengurus/${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("Pengurus dihapus");
            fetchData();
          } else toast.error("Gagal menghapus");
        } catch {
          toast.error("Terjadi kesalahan");
        }
      },
    });
  };

  const tab = useMemo(() => {
    const hitung = (t: string) => list.filter((p) => p.tingkatan === t).length;
    return [
      { id: "semua", label: "Semua", jumlah: list.length },
      { id: "PD", label: "Pimpinan Daerah", jumlah: hitung("PD") },
      { id: "PC", label: "Pimpinan Cabang", jumlah: hitung("PC") },
      { id: "Permata", label: "Permata", jumlah: hitung("Permata") },
    ].filter((t) => t.id === "semua" || t.jumlah > 0);
  }, [list]);

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    let hasil = list;
    if (tingkatan !== "semua") hasil = hasil.filter((p) => p.tingkatan === tingkatan);
    if (q) {
      hasil = hasil.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) || p.jabatan.toLowerCase().includes(q)
      );
    }
    return hasil;
  }, [list, tingkatan, cari]);

  const totalHalaman = Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN));
  const halamanAman = Math.min(halaman, totalHalaman);
  const terlihat = tersaring.slice(
    (halamanAman - 1) * PER_HALAMAN,
    halamanAman * PER_HALAMAN
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Data Pengurus
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola struktur dan daftar pengurus PD BKMT Kubu Raya.
          </p>
        </div>
        <Link href="/admin/pengurus/baru" className="shrink-0">
          <Button>
            <Plus className="h-4 w-4" /> Tambah Pengurus
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-5 pt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {tab.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTingkatan(t.id);
                  setHalaman(1);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  tingkatan === t.id
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
                aria-label="Cari nama pengurus"
                placeholder="Cari nama atau jabatan..."
                value={cari}
                onChange={(e) => {
                  setCari(e.target.value);
                  setHalaman(1);
                }}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <TableSkeleton cols={5} />
          ) : terlihat.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {cari || tingkatan !== "semua"
                  ? "Tidak ada pengurus yang cocok"
                  : "Belum ada pengurus. Tambahkan pengurus pertama!"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-slate-500">
                    <th className="py-2.5 pr-3 font-semibold w-10">#</th>
                    <th className="py-2.5 px-3 font-semibold">Nama</th>
                    <th className="py-2.5 px-3 font-semibold">Jabatan</th>
                    <th className="py-2.5 px-3 font-semibold">Periode</th>
                    <th className="py-2.5 px-3 font-semibold">Kontak</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-2.5 pl-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {terlihat.map((p, i) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/70 last:border-0 hover:bg-surface-muted transition-colors"
                    >
                      <td className="py-3 pr-3 text-slate-400">
                        {(halamanAman - 1) * PER_HALAMAN + i + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar: foto bila ada, jika tidak inisial nama */}
                          <div className="h-9 w-9 rounded-full bg-brand-50 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                            {p.fotoUrl ? (
                              <img
                                src={p.fotoUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-brand-700 text-xs font-bold">
                                {p.nama.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {p.nama}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {LABEL_TINGKATAN[p.tingkatan] ?? p.tingkatan}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{p.jabatan}</td>
                      <td className="py-3 px-3 text-slate-500">{p.periode || "-"}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {p.alamat ? (
                          <span className="flex items-center gap-1.5 max-w-[200px] truncate">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                            <span className="truncate">{p.alamat}</span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={p.aktif ? "default" : "secondary"}>
                          {p.aktif ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/pengurus/${p.id}`}>
                            <Button
                              aria-label={`Edit ${p.nama}`}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            aria-label={`Hapus ${p.nama}`}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(p.id, p.nama)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalHalaman > 1 && (
                <Pagination
                  currentPage={halamanAman}
                  totalPages={totalHalaman}
                  onPageChange={setHalaman}
                  itemsPerPage={PER_HALAMAN}
                  totalItems={tersaring.length}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {dialog}
    </div>
  );
}
