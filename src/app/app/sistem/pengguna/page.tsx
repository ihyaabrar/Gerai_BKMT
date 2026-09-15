"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  Users, Plus, Edit, Ban, Search, KeyRound, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { CEK_INTERNET, CEK_SEBELUM_ULANG } from "@/lib/pesan";
import { useAuthStore } from "@/store/auth";

interface Pengguna {
  id: string;
  nama: string;
  username: string;
  role: string;
  aktif: boolean;
  createdAt: string;
}

const LABEL_ROLE: Record<string, string> = {
  master: "Master",
  admin: "Admin",
  kasir: "Kasir",
};

const KETERANGAN_ROLE: Record<string, string> = {
  master: "Akses penuh termasuk pengelolaan pengguna",
  admin: "Akses penuh kecuali pengelolaan pengguna",
  kasir: "Kasir, inventori, dan pencatatan pengeluaran",
};

const FORM_KOSONG = {
  nama: "",
  username: "",
  password: "",
  role: "kasir",
};

export default function PenggunaPage() {
  const { user } = useAuthStore();
  const { konfirmasi, dialog } = useConfirm();

  const [list, setList] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState("");
  const [saring, setSaring] = useState<string>("semua");

  const [formTerbuka, setFormTerbuka] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_KOSONG);
  const [menyimpan, setMenyimpan] = useState(false);

  const [gantiTerbuka, setGantiTerbuka] = useState(false);
  const [formGanti, setFormGanti] = useState({ passwordLama: "", passwordBaru: "" });
  const [menggantiSandi, setMenggantiSandi] = useState(false);

  const ambil = () => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Gagal memuat daftar pengguna"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    ambil();
  }, []);

  const bukaTambah = () => {
    setEditId(null);
    setForm(FORM_KOSONG);
    setFormTerbuka(true);
  };

  const bukaEdit = (p: Pengguna) => {
    setEditId(p.id);
    // Password dikosongkan: hanya diisi bila memang ingin diganti.
    setForm({ nama: p.nama, username: p.username, password: "", role: p.role });
    setFormTerbuka(true);
  };

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (menyimpan) return;
    setMenyimpan(true);
    try {
      const res = await fetch("/api/user", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editId
            ? {
                id: editId,
                nama: form.nama,
                role: form.role,
                ...(form.password ? { password: form.password } : {}),
              }
            : form
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Gagal menyimpan pengguna");
        return;
      }
      toast.success(editId ? "Pengguna diperbarui" : "Pengguna ditambahkan");
      setFormTerbuka(false);
      ambil();
    } catch {
      toast.error("Pengguna belum tersimpan", { description: CEK_SEBELUM_ULANG });
    } finally {
      setMenyimpan(false);
    }
  };

  const ubahStatus = (p: Pengguna) => {
    if (p.aktif) {
      konfirmasi({
        judul: "Nonaktifkan pengguna?",
        pesan: (
          <>
            <strong>{p.nama}</strong> tidak akan bisa masuk lagi. Riwayat shift dan
            transaksinya tetap tersimpan.
          </>
        ),
        labelKonfirmasi: "Nonaktifkan",
        aksi: async () => {
          const res = await fetch(`/api/user?id=${p.id}`, { method: "DELETE" });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            toast.error(data?.error || "Gagal menonaktifkan pengguna");
            return;
          }
          toast.success("Pengguna dinonaktifkan");
          ambil();
        },
      });
      return;
    }

    konfirmasi({
      judul: "Aktifkan kembali pengguna?",
      pesan: (
        <>
          <strong>{p.nama}</strong> akan bisa masuk kembali dengan password yang ada.
        </>
      ),
      labelKonfirmasi: "Aktifkan",
      nada: "normal",
      aksi: async () => {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: p.id, aktif: true }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(data?.error || "Gagal mengaktifkan pengguna");
          return;
        }
        toast.success("Pengguna diaktifkan");
        ambil();
      },
    });
  };

  const gantiPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (menggantiSandi) return;
    setMenggantiSandi(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formGanti),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Gagal mengganti password");
        return;
      }
      toast.success("Password berhasil diganti");
      setGantiTerbuka(false);
      setFormGanti({ passwordLama: "", passwordBaru: "" });
    } catch {
      toast.error("Password belum berganti", { description: CEK_INTERNET });
    } finally {
      setMenggantiSandi(false);
    }
  };

  const tab = useMemo(() => {
    const hitung = (r: string) => list.filter((p) => p.role === r).length;
    return [
      { id: "semua", label: "Semua", jumlah: list.length },
      { id: "master", label: "Master", jumlah: hitung("master") },
      { id: "admin", label: "Admin", jumlah: hitung("admin") },
      { id: "kasir", label: "Kasir", jumlah: hitung("kasir") },
    ].filter((t) => t.id === "semua" || t.jumlah > 0);
  }, [list]);

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    let hasil = list;
    if (saring !== "semua") hasil = hasil.filter((p) => p.role === saring);
    if (q) {
      hasil = hasil.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
      );
    }
    return hasil;
  }, [list, saring, cari]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Pengguna
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akun dan hak akses pengguna sistem.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setGantiTerbuka(true)}>
            <KeyRound className="h-4 w-4" />
            Ganti Password Saya
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={bukaTambah}>
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
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
                aria-label="Cari pengguna"
                placeholder="Cari nama atau username..."
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <TableSkeleton cols={5} />
          ) : tersaring.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {cari || saring !== "semua"
                  ? "Tidak ada pengguna yang cocok"
                  : "Belum ada pengguna"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-slate-500">
                    <th className="py-2.5 pr-3 font-semibold">Nama</th>
                    <th className="py-2.5 px-3 font-semibold">Username</th>
                    <th className="py-2.5 px-3 font-semibold">Role</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-2.5 pl-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tersaring.map((p) => {
                    const diriSendiri = p.id === user?.id;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-border/70 last:border-0 hover:bg-surface-muted transition-colors"
                      >
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <span className="h-9 w-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {p.nama.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {p.nama}
                                {diriSendiri && (
                                  <span className="text-xs text-slate-400 font-normal">
                                    {" "}
                                    (Anda)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {KETERANGAN_ROLE[p.role]}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-xs">
                          {p.username}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              p.role === "master"
                                ? "default"
                                : p.role === "admin"
                                ? "info"
                                : "secondary"
                            }
                            className="gap-1"
                          >
                            {p.role === "master" ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : p.role === "admin" ? (
                              <ShieldAlert className="h-3 w-3" />
                            ) : null}
                            {LABEL_ROLE[p.role] ?? p.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={p.aktif ? "default" : "secondary"}>
                            {p.aktif ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>
                        <td className="py-3 pl-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              aria-label={`Edit ${p.nama}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => bukaEdit(p)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              aria-label={`${p.aktif ? "Nonaktifkan" : "Aktifkan"} ${p.nama}`}
                              variant="ghost"
                              size="sm"
                              disabled={diriSendiri}
                              title={
                                diriSendiri
                                  ? "Tidak bisa menonaktifkan akun sendiri"
                                  : undefined
                              }
                              className={
                                p.aktif
                                  ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                                  : "text-brand-600 hover:bg-brand-50"
                              }
                              onClick={() => ubahStatus(p)}
                            >
                              <Ban className="h-4 w-4" />
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

      {/* Form tambah / edit */}
      <Dialog open={formTerbuka} onOpenChange={setFormTerbuka}>
        <DialogContent onClose={() => setFormTerbuka(false)}>
          <DialogHeader>
            <DialogTitle>{editId ? "Ubah Pengguna" : "Tambah Pengguna"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={simpan} className="space-y-4">
            <div>
              <label htmlFor="u-nama" className="block text-sm font-medium text-slate-700">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <Input
                id="u-nama"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <label
                htmlFor="u-username"
                className="block text-sm font-medium text-slate-700"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <Input
                id="u-username"
                required
                value={form.username}
                disabled={!!editId}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                {editId
                  ? "Username tidak bisa diubah setelah akun dibuat"
                  : "Huruf, angka, titik, garis bawah, dan strip"}
              </p>
            </div>

            <div>
              <label
                htmlFor="u-password"
                className="block text-sm font-medium text-slate-700"
              >
                Password {!editId && <span className="text-red-500">*</span>}
              </label>
              <Input
                id="u-password"
                type="password"
                required={!editId}
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1.5"
                placeholder={editId ? "Kosongkan bila tidak diganti" : ""}
              />
              <p className="text-xs text-slate-400 mt-1.5">Minimal 8 karakter</p>
            </div>

            <div>
              <label htmlFor="u-role" className="block text-sm font-medium text-slate-700">
                Role <span className="text-red-500">*</span>
              </label>
              <Select
                id="u-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1.5"
              >
                <option value="kasir">Kasir</option>
                <option value="admin">Admin</option>
                <option value="master">Master</option>
              </Select>
              <p className="text-xs text-slate-400 mt-1.5">
                {KETERANGAN_ROLE[form.role]}
              </p>
            </div>

            <Button type="submit" disabled={menyimpan} className="w-full">
              {menyimpan ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Pengguna"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ganti password sendiri */}
      <Dialog open={gantiTerbuka} onOpenChange={setGantiTerbuka}>
        <DialogContent onClose={() => setGantiTerbuka(false)}>
          <DialogHeader>
            <DialogTitle>Ganti Password Saya</DialogTitle>
          </DialogHeader>
          <form onSubmit={gantiPassword} className="space-y-4">
            <div>
              <label
                htmlFor="p-lama"
                className="block text-sm font-medium text-slate-700"
              >
                Password Saat Ini <span className="text-red-500">*</span>
              </label>
              <Input
                id="p-lama"
                type="password"
                required
                value={formGanti.passwordLama}
                onChange={(e) =>
                  setFormGanti({ ...formGanti, passwordLama: e.target.value })
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <label
                htmlFor="p-baru"
                className="block text-sm font-medium text-slate-700"
              >
                Password Baru <span className="text-red-500">*</span>
              </label>
              <Input
                id="p-baru"
                type="password"
                required
                minLength={8}
                value={formGanti.passwordBaru}
                onChange={(e) =>
                  setFormGanti({ ...formGanti, passwordBaru: e.target.value })
                }
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1.5">Minimal 8 karakter</p>
            </div>
            <Button type="submit" disabled={menggantiSandi} className="w-full">
              {menggantiSandi ? "Memproses..." : "Ganti Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  );
}
