"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Users, Search, Edit, Trash2 } from "lucide-react";
import { generateKode } from "@/lib/utils";
import { toast } from "sonner";

interface Member {
  id: string;
  kode: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  poin: number;
}

export default function MemberPage() {
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
    const res = await fetch("/api/member");
    const data = await res.json();
    setMembers(data);
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
        const lastNumber = members.length > 0
          ? parseInt(members[members.length - 1].kode.replace(/\D/g, "")) || members.length
          : 0;
        const kode = generateKode("MBR", lastNumber);
        res = await fetch("/api/member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, kode }),
        });
      }

      if (!res.ok) throw new Error();
      toast.success(editId ? "Member berhasil diupdate" : "Member berhasil ditambahkan");
      setShowForm(false);
      fetchMembers();
    } catch {
      toast.error("Gagal menyimpan member");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus member "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/member?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Member berhasil dihapus");
      fetchMembers();
    } catch {
      toast.error("Gagal menghapus member");
    }
  };

  const filtered = members.filter(
    (m) =>
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.kode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Member</h1>
          <p className="text-gray-500">Data pelanggan setia</p>
        </div>
        <Button onClick={openAdd}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Member
            </CardTitle>
            <div className="relative w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
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
            <div className="text-center py-10 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{search ? "Member tidak ditemukan" : "Belum ada member"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
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
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-sm">{m.kode}</td>
                      <td className="py-3 px-4">{m.nama}</td>
                      <td className="py-3 px-4 text-gray-600">{m.telepon || "-"}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">{m.alamat || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                          {m.poin}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id, m.nama)}>
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
              <label className="text-sm font-medium">Nama Lengkap</label>
              <Input
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama member"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telepon</label>
              <Input
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                placeholder="08xx"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Alamat</label>
              <Input
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
    </div>
  );
}
