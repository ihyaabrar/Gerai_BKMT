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
import {
  Plus, Edit, Trash2, FileText, Eye, EyeOff, Search, Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

interface Berita {
  id: string;
  judul: string;
  slug: string;
  status: string;
  gambarUrl: string | null;
  ringkasan: string | null;
  tanggalPublikasi: string | null;
  createdAt: string;
  penulis?: { nama: string } | null;
}

type Saringan = "semua" | "published" | "draft";
const PER_HALAMAN = 8;

export default function AdminBeritaPage() {
  const { konfirmasi, dialog } = useConfirm();
  const [beritaList, setBeritaList] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);
  const [saringan, setSaringan] = useState<Saringan>("semua");
  const [cari, setCari] = useState("");
  const [urutan, setUrutan] = useState<"terbaru" | "terlama" | "judul">("terbaru");
  const [halaman, setHalaman] = useState(1);

  const fetchBerita = () => {
    fetch("/api/admin/berita")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => setBeritaList(res.data || []))
      .catch(() => toast.error("Gagal memuat berita"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBerita();
  }, []);

  const handleDelete = (id: string, judul: string) => {
    konfirmasi({
      judul: "Hapus berita?",
      pesan: (
        <>
          Berita <strong>{judul}</strong> akan dihapus permanen.
        </>
      ),
      aksi: async () => {
        try {
          const res = await fetch(`/api/admin/berita/${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("Berita dihapus");
            fetchBerita();
          } else toast.error("Gagal menghapus");
        } catch {
          toast.error("Terjadi kesalahan");
        }
      },
    });
  };

  const published = beritaList.filter((b) => b.status === "published");
  const draft = beritaList.filter((b) => b.status !== "published");

  const tab: { id: Saringan; label: string; jumlah: number }[] = [
    { id: "semua", label: "Semua", jumlah: beritaList.length },
    { id: "published", label: "Dipublikasikan", jumlah: published.length },
    { id: "draft", label: "Draft", jumlah: draft.length },
  ];

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    let hasil = beritaList;

    if (saringan === "published") hasil = published;
    if (saringan === "draft") hasil = draft;
    if (q) hasil = hasil.filter((b) => b.judul.toLowerCase().includes(q));

    const waktu = (b: Berita) =>
      new Date(b.tanggalPublikasi ?? b.createdAt).getTime();

    return [...hasil].sort((a, b) => {
      if (urutan === "judul") return a.judul.localeCompare(b.judul);
      return urutan === "terlama" ? waktu(a) - waktu(b) : waktu(b) - waktu(a);
    });
  }, [beritaList, saringan, cari, urutan, published, draft]);

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
            Berita &amp; Pengumuman
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola semua konten berita, kegiatan, dan pengumuman yang tampil di
            website publik.
          </p>
        </div>
        <Link href="/admin/berita/baru" className="shrink-0">
          <Button>
            <Plus className="h-4 w-4" /> Tulis Berita
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-5 pt-5 space-y-4">
          {/* Penyaring */}
          <div className="flex flex-wrap items-center gap-2">
            {tab.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSaringan(t.id);
                  setHalaman(1);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  saringan === t.id
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
                aria-label="Cari judul berita"
                placeholder="Cari judul berita..."
                value={cari}
                onChange={(e) => {
                  setCari(e.target.value);
                  setHalaman(1);
                }}
                className="h-9 pl-9 text-sm"
              />
            </div>

            <select
              aria-label="Urutkan berita"
              value={urutan}
              onChange={(e) => setUrutan(e.target.value as typeof urutan)}
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-slate-600 focus-visible:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20"
            >
              <option value="terbaru">Urutkan: Terbaru</option>
              <option value="terlama">Urutkan: Terlama</option>
              <option value="judul">Urutkan: Judul A–Z</option>
            </select>
          </div>

          {/* Tabel */}
          {loading ? (
            <TableSkeleton cols={5} />
          ) : terlihat.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {cari || saringan !== "semua"
                  ? "Tidak ada berita yang cocok"
                  : "Belum ada berita. Tulis berita pertama!"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-slate-500">
                    <th className="py-2.5 pr-3 font-semibold w-10">#</th>
                    <th className="py-2.5 px-3 font-semibold">Judul</th>
                    <th className="py-2.5 px-3 font-semibold">Penulis</th>
                    <th className="py-2.5 px-3 font-semibold">Tanggal</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-2.5 pl-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {terlihat.map((b, i) => (
                    <tr
                      key={b.id}
                      className="border-b border-border/70 last:border-0 hover:bg-surface-muted transition-colors"
                    >
                      <td className="py-3 pr-3 text-slate-400">
                        {(halamanAman - 1) * PER_HALAMAN + i + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Kolom gambar mengikuti desain; placeholder dipakai
                              bila berita belum punya gambar. */}
                          <div className="h-10 w-14 rounded-lg bg-surface-sunken border border-border overflow-hidden shrink-0 flex items-center justify-center">
                            {b.gambarUrl ? (
                              <img
                                src={b.gambarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 line-clamp-1">
                              {b.judul}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              /berita/{b.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {b.penulis?.nama ?? "-"}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {b.tanggalPublikasi
                          ? format(new Date(b.tanggalPublikasi), "d MMM yyyy", {
                              locale: localeId,
                            })
                          : "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={b.status === "published" ? "default" : "secondary"}
                          className="gap-1"
                        >
                          {b.status === "published" ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {b.status === "published" ? "Dipublikasikan" : "Draft"}
                        </Badge>
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/berita/${b.id}`}>
                            <Button
                              aria-label={`Edit ${b.judul}`}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            aria-label={`Hapus ${b.judul}`}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(b.id, b.judul)}
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
