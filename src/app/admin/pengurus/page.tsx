"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Pengurus {
  id: string; nama: string; jabatan: string; tingkatan: string;
  periode: string | null; urutan: number; aktif: boolean;
}

const TINGKATAN_COLOR: Record<string, string> = {
  PD: "bg-emerald-100 text-emerald-700",
  PC: "bg-blue-100 text-blue-700",
  Permata: "bg-violet-100 text-violet-700",
};

export default function AdminPengurusPage() {
  const [list, setList] = useState<Pengurus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch("/api/admin/pengurus").then((r) => r.json())
      .then((res) => setList(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus pengurus "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/admin/pengurus/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Pengurus dihapus"); fetchData(); }
      else toast.error("Gagal menghapus");
    } catch { toast.error("Terjadi kesalahan"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-violet-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengurus</h1>
            <p className="text-gray-500 text-sm">{list.length} total pengurus</p>
          </div>
        </div>
        <Link href="/admin/pengurus/baru">
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" /> Tambah Pengurus
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada pengurus. Tambahkan pengurus pertama!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-sm font-semibold text-gray-700">Nama</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Jabatan</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Tingkatan</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Urutan</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">{p.nama}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{p.jabatan}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TINGKATAN_COLOR[p.tingkatan] || "bg-gray-100 text-gray-600"}`}>
                      {p.tingkatan}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-500">{p.urutan}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/admin/pengurus/${p.id}`}>
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4 text-blue-600" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id, p.nama)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
