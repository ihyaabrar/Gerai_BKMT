"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FileText, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Berita {
  id: string; judul: string; slug: string; status: string;
  tanggalPublikasi: string | null; createdAt: string;
}

export default function AdminBeritaPage() {
  const [beritaList, setBeritaList] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBerita = () => {
    fetch("/api/admin/berita").then((r) => r.json())
      .then((res) => setBeritaList(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBerita(); }, []);

  const handleDelete = async (id: string, judul: string) => {
    if (!confirm(`Hapus berita "${judul}"?`)) return;
    try {
      const res = await fetch(`/api/admin/berita/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Berita dihapus"); fetchBerita(); }
      else toast.error("Gagal menghapus");
    } catch { toast.error("Terjadi kesalahan"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Berita & Pengumuman</h1>
            <p className="text-gray-500 text-sm">{beritaList.length} total berita</p>
          </div>
        </div>
        <Link href="/admin/berita/baru">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> Buat Berita
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat...</div>
        ) : beritaList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada berita. Buat berita pertama!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-sm font-semibold text-gray-700">Judul</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Tanggal</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {beritaList.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 line-clamp-1">{b.judul}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/berita/{b.slug}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      b.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {b.status === "published" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {b.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {b.tanggalPublikasi ? format(new Date(b.tanggalPublikasi), "d MMM yyyy") : "-"}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/admin/berita/${b.id}`}>
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4 text-blue-600" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id, b.judul)}>
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
