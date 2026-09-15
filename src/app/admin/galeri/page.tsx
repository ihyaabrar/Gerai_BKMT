"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { gambarLebar, LEBAR } from "@/lib/gambar";
import { Plus, Edit, Trash2, ImageIcon, Search, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { CEK_SEBELUM_ULANG } from "@/lib/pesan";

interface Foto {
  id: string;
  judul: string;
  deskripsi: string | null;
  gambarUrl: string;
  kategori: string | null;
  urutan: number;
  aktif: boolean;
}

const FORM_KOSONG = {
  judul: "",
  deskripsi: "",
  gambarUrl: "",
  kategori: "",
  urutan: "0",
  aktif: true,
};

export default function AdminGaleriPage() {
  const { konfirmasi, dialog } = useConfirm();
  const [list, setList] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState("");
  const [terbuka, setTerbuka] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_KOSONG);
  const [menyimpan, setMenyimpan] = useState(false);

  const ambil = () => {
    fetch("/api/admin/galeri")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => setList(res.data || []))
      .catch(() => toast.error("Gagal memuat galeri"))
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

  const bukaEdit = (f: Foto) => {
    setEditId(f.id);
    setForm({
      judul: f.judul,
      deskripsi: f.deskripsi ?? "",
      gambarUrl: f.gambarUrl,
      kategori: f.kategori ?? "",
      urutan: String(f.urutan),
      aktif: f.aktif,
    });
    setTerbuka(true);
  };

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gambarUrl) {
      toast.error("Foto belum diunggah");
      return;
    }
    if (menyimpan) return;
    setMenyimpan(true);
    try {
      const res = await fetch("/api/admin/galeri", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editId ? { id: editId } : {}),
          ...form,
          urutan: Number(form.urutan) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan foto");
        return;
      }
      toast.success(editId ? "Foto diperbarui" : "Foto ditambahkan");
      setTerbuka(false);
      ambil();
    } catch {
      toast.error("Foto belum tersimpan", { description: CEK_SEBELUM_ULANG });
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = (f: Foto) => {
    konfirmasi({
      judul: "Hapus foto?",
      pesan: (
        <>
          <strong>{f.judul}</strong> akan dihapus permanen dari galeri.
        </>
      ),
      aksi: async () => {
        const res = await fetch(`/api/admin/galeri?id=${f.id}`, { method: "DELETE" });
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          toast.error(d?.error || "Gagal menghapus foto");
          return;
        }
        toast.success("Foto dihapus");
        ambil();
      },
    });
  };

  const ubahTampil = async (f: Foto) => {
    const res = await fetch("/api/admin/galeri", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: f.id, aktif: !f.aktif }),
    });
    if (!res.ok) {
      toast.error("Gagal mengubah status tampil");
      return;
    }
    toast.success(f.aktif ? "Foto disembunyikan" : "Foto ditampilkan");
    ambil();
  };

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (f) =>
        f.judul.toLowerCase().includes(q) ||
        (f.kategori ?? "").toLowerCase().includes(q)
    );
  }, [list, cari]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Galeri</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Dokumentasi foto kegiatan yang tampil di halaman publik.
          </p>
        </div>
        <Button onClick={bukaTambah} className="shrink-0">
          <Plus className="h-4 w-4" /> Tambah Foto
        </Button>
      </div>

      <Card>
        <CardContent className="p-5 pt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate-500">
              {list.filter((f) => f.aktif).length} tampil · {list.length} total
            </p>
            <div className="relative ml-auto w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                aria-label="Cari foto"
                placeholder="Cari judul atau kategori..."
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full rounded-card" />
              ))}
            </div>
          ) : tersaring.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {cari ? "Tidak ada foto yang cocok" : "Belum ada foto di galeri"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tersaring.map((f) => (
                <div
                  key={f.id}
                  className={cn(
                    "rounded-card border border-border overflow-hidden bg-white transition-colors",
                    !f.aktif && "opacity-60"
                  )}
                >
                  <div className="aspect-[4/3] bg-surface-sunken">
                    <img
                      src={gambarLebar(f.gambarUrl, LEBAR.kartu)}
                      alt={f.judul}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-slate-900 line-clamp-1">
                        {f.judul}
                      </p>
                      {!f.aktif && <Badge variant="secondary">Disembunyikan</Badge>}
                    </div>
                    {f.kategori && (
                      <p className="text-xs text-slate-400 mt-0.5">{f.kategori}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2.5">
                      <Button
                        aria-label={`Edit ${f.judul}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => bukaEdit(f)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        aria-label={`${f.aktif ? "Sembunyikan" : "Tampilkan"} ${f.judul}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => ubahTampil(f)}
                      >
                        {f.aktif ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        aria-label={`Hapus ${f.judul}`}
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => hapus(f)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={terbuka} onOpenChange={setTerbuka}>
        <DialogContent onClose={() => setTerbuka(false)}>
          <DialogHeader>
            <DialogTitle>{editId ? "Ubah Foto" : "Tambah Foto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={simpan} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1.5">
                Foto <span className="text-red-500">*</span>
              </p>
              <ImageUpload
                value={form.gambarUrl}
                onChange={(url) => setForm({ ...form, gambarUrl: url })}
                folder="galeri"
                label="Pilih Foto"
                shape="square"
                previewSize="lg"
              />
            </div>

            <div>
              <label htmlFor="g-judul" className="block text-sm font-medium text-slate-700">
                Judul <span className="text-red-500">*</span>
              </label>
              <Input
                id="g-judul"
                required
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="g-kategori"
                  className="block text-sm font-medium text-slate-700"
                >
                  Kategori
                </label>
                <Input
                  id="g-kategori"
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  placeholder="Kegiatan, Sosial..."
                  className="mt-1.5"
                />
              </div>
              <div>
                <label
                  htmlFor="g-urutan"
                  className="block text-sm font-medium text-slate-700"
                >
                  Urutan
                </label>
                <Input
                  id="g-urutan"
                  type="number"
                  min={0}
                  value={form.urutan}
                  onChange={(e) => setForm({ ...form, urutan: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="g-deskripsi"
                className="block text-sm font-medium text-slate-700"
              >
                Deskripsi
              </label>
              <textarea
                id="g-deskripsi"
                rows={3}
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                className="mt-1.5 flex w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <Button type="submit" disabled={menyimpan} className="w-full">
              {menyimpan ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Foto"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  );
}
