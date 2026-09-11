"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Users, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface Member {
  id: string;
  kode: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  poin: number;
}

export default function MemberPage() {
  const { konfirmasi, dialog } = useConfirm();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nama: "", telepon: "", alamat: "" });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/member");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Gagal memuat data member");
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ nama: "", telepon: "", alamat: "" });
    setShowForm(true);
  };

  const openEdit = (m: Member) => {
    setEditId(m.id);
    setForm({ nama: m.nama, telepon: m.telepon || "", alamat: m.alamat || "" });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res: Response;
      if (editId) {
        res = await fetch("/api/member", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...form }),
        });
      } else {
        // Kode member dibuat server supaya tidak bentrok.
        res = await fetch("/api/member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Gagal menyimpan member");
        return;
      }
      toast.success(editId ? "Member berhasil diupdate" : "Member berhasil ditambahkan");
      setShowForm(false);
      fetchMembers();
    } catch {
      toast.error("Gagal menyimpan member");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, nama: string) => {
    konfirmasi({
      judul: "Hapus member?",
      pesan: <><strong>{nama}</strong> tidak akan muncul lagi di daftar member.</>,
      aksi: async () => {
        try {
          const res = await fetch(`/api/member?id=${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error();
          toast.success("Member berhasil dihapus");
          fetchMembers();
        } catch {
          toast.error("Gagal menghapus member");
        }
      },
    });
  };

  const filtered = members.filter(
    (m) =>
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.kode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Member</h1>
          <p className="text-slate-500">Data pelanggan setia</p>
        </div>
        <Button onClick={openAdd}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Member
            </CardTitle>
            <div className="relative w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input aria-label="Cari member..."
                placeholder="Cari member..."
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
              <p>{search ? "Member tidak ditemukan" : "Belum ada member"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Kode</th>
                    <th className="text-left py-3 px-4">Nama</th>
                    <th className="text-left py-3 px-4">Telepon</th>
                    <th className="text-left py-3 px-4">Alamat</th>
                    <th className="text-center py-3 px-4">Poin</th>
                    <th className="text-center py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-surface-muted">
                      <td className="py-3 px-4 font-medium text-sm">{m.kode}</td>
                      <td className="py-3 px-4">{m.nama}</td>
                      <td className="py-3 px-4 text-slate-600">{m.telepon || "-"}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">{m.alamat || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                          {m.poin}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <Button aria-label={`Edit ${m.nama}`} variant="ghost" size="sm" onClick={() => openEdit(m)}>
                            <Edit className="h-4 w-4 text-brand-600" />
                          </Button>
                          <Button aria-label={`Hapus ${m.nama}`} variant="ghost" size="sm" onClick={() => handleDelete(m.id, m.nama)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md" onClose={() => setShowForm(false)}>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Member" : "Tambah Member Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="nama-lengkap">Nama Lengkap</label>
              <Input id="nama-lengkap"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama member"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="telepon">Telepon</label>
              <Input id="telepon"
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                placeholder="08xx"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="alamat">Alamat</label>
              <Input id="alamat"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Alamat lengkap"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : editId ? "Update Member" : "Simpan Member"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {dialog}
    </div>
  );
}
