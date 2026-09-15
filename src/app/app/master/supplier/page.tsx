"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Truck, Plus, Edit, Trash2, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { TableSkeleton } from "@/components/ui/skeleton";

interface Supplier {
  id: string;
  nama: string;
  telepon: string;
  alamat: string;
  aktif: boolean;
}

export default function SupplierPage() {
  const { konfirmasi, dialog } = useConfirm();
  const [supplier, setSupplier] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nama: "",
    telepon: "",
    alamat: "",
  });

  const fetchSupplier = async () => {
    try {
      const res = await fetch("/api/supplier");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSupplier(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Gagal memuat data supplier");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editId ? "/api/supplier" : "/api/supplier";
      const method = editId ? "PATCH" : "POST";
      const body = editId ? { id: editId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Gagal menyimpan supplier");
        return;
      }

      setOpen(false);
      setEditId(null);
      setForm({ nama: "", telepon: "", alamat: "" });
      fetchSupplier();
      toast.success(editId ? "Supplier berhasil diperbarui" : "Supplier berhasil ditambahkan");
    } catch {
      toast.error("Gagal menyimpan supplier");
    }
  };

  const handleEdit = (s: Supplier) => {
    setEditId(s.id);
    setForm({
      nama: s.nama,
      telepon: s.telepon,
      alamat: s.alamat,
    });
    setOpen(true);
  };

  const handleDelete = (id: string, nama: string) => {
    konfirmasi({
      judul: "Hapus supplier?",
      pesan: <><strong>{nama}</strong> tidak akan muncul lagi di daftar supplier.</>,
      aksi: () => hapusSupplier(id),
    });
  };

  const hapusSupplier = async (id: string) => {
    try {
      const res = await fetch(`/api/supplier?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Gagal menghapus supplier");
        return;
      }

      fetchSupplier();
      toast.success("Supplier berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus supplier");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Supplier</h1>
          <p className="text-sm text-slate-500 mt-1">Daftar pemasok barang</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditId(null);
              setForm({ nama: "", telepon: "", alamat: "" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editId ? "Ubah Data Supplier" : "Tambah Supplier"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="nama-supplier">Nama Supplier</label>
                <Input id="nama-supplier"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="PT. Supplier ABC"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="telepon">Telepon</label>
                <Input id="telepon"
                  value={form.telepon}
                  onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                  placeholder="08123456789"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="alamat">Alamat</label>
                <textarea id="alamat"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  placeholder="Alamat lengkap supplier"
                  rows={3}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
              >
                {editId ? "Simpan Perubahan" : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <CardIcon icon={Truck} nada="brand" />
            Daftar Supplier
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton cols={4} />
          ) : supplier.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada supplier</p>
            </div>
          ) : (
            // Disajikan sebagai tabel, sama seperti Member dan Nasabah.
            // Sebelumnya supplier memakai grid kartu, sehingga tiga halaman
            // data master yang setara punya tiga model tampilan berbeda.
            <>
            <ul className="md:hidden divide-y divide-border">
              {supplier.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-slate-900 break-words">{s.nama}</p>
                    {s.telepon && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {s.telepon}
                      </p>
                    )}
                    {s.alamat && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1 break-words">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" /> {s.alamat}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Ubah ${s.nama}`} onClick={() => handleEdit(s)} className="shrink-0">
                    <Edit className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus ${s.nama}`}
                    onClick={() => handleDelete(s.id, s.nama)}
                    className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nama Supplier</th>
                    <th className="text-left py-3 px-4">Telepon</th>
                    <th className="text-left py-3 px-4">Alamat</th>
                    <th className="text-center py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-surface-muted">
                      <td className="py-3 px-4 font-medium">{s.nama}</td>
                      <td className="py-3 px-4 text-slate-600">{s.telepon || "-"}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-[280px] truncate">
                        {s.alamat || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Edit ${s.nama}`}
                            onClick={() => handleEdit(s)}
                          >
                            <Edit className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Hapus ${s.nama}`}
                            onClick={() => handleDelete(s.id, s.nama)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
      {dialog}
    </div>
  );
}
