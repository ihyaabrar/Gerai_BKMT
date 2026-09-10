"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { TableSkeleton } from "@/components/ui/skeleton";

interface Pengurus {
  id: string; nama: string; jabatan: string; tingkatan: string;
  periode: string | null; urutan: number; aktif: boolean;
}

const TINGKATAN_COLOR: Record<string, string> = {
  PD: "bg-emerald-100 text-emerald-700",
  PC: "bg-blue-100 text-blue-700",
  Permata: "bg-violet-50 text-violet-600",
};

export default function AdminPengurusPage() {
  const { konfirmasi, dialog } = useConfirm();
  const [list, setList] = useState<Pengurus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch("/api/admin/pengurus").then((r) => r.json())
      .then((res) => setList(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = (id: string, nama: string) => {
    konfirmasi({
      judul: "Hapus pengurus?",
      pesan: <><strong>{nama}</strong> akan dihapus permanen dari daftar pengurus.</>,
      aksi: async () => {
        try {
          const res = await fetch(`/api/admin/pengurus/${id}`, { method: "DELETE" });
          if (res.ok) { toast.success("Pengurus dihapus"); fetchData(); }
          else toast.error("Gagal menghapus");
        } catch { toast.error("Terjadi kesalahan"); }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-violet-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pengurus</h1>
            <p className="text-slate-500 text-sm">{list.length} total pengurus</p>
          </div>
        </div>
        <Link href="/admin/pengurus/baru">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Tambah Pengurus
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <TableSkeleton cols={5} />
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada pengurus. Tambahkan pengurus pertama!</p>
          </div>
        ) : (
          // Tabel bisa di-scroll horizontal supaya tidak melebarkan halaman di HP
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-surface-muted border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-sm font-semibold text-slate-700">Nama</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Jabatan</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Tingkatan</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Urutan</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-surface-muted">
                  <td className="px-5 py-4 font-medium text-slate-900">{p.nama}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{p.jabatan}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TINGKATAN_COLOR[p.tingkatan] || "bg-gray-100 text-gray-600"}`}>
                      {p.tingkatan}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-slate-500">{p.urutan}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/admin/pengurus/${p.id}`}>
                        <Button aria-label="Edit" variant="ghost" size="sm"><Edit className="h-4 w-4 text-brand-600" /></Button>
                      </Link>
                      <Button aria-label={`Hapus ${p.nama}`} variant="ghost" size="sm" onClick={() => handleDelete(p.id, p.nama)}>
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
      </div>
      {dialog}
    </div>
  );
}
