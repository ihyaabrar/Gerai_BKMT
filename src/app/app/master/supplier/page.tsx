"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Truck, Plus, Edit, Trash2, Phone, MapPin } from "lucide-react";

interface Supplier {
  id: string;
  nama: string;
  telepon: string;
  alamat: string;
  aktif: boolean;
}

export default function SupplierPage() {
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
      const data = await res.json();
      setSupplier(data);
    } catch (error) {
      console.error("Failed to fetch supplier:", error);
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

      if (res.ok) {
        setOpen(false);
        setEditId(null);
        setForm({ nama: "", telepon: "", alamat: "" });
        fetchSupplier();
      }
    } catch (error) {
      console.error("Failed to save supplier:", error);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus supplier ini?")) return;

    try {
      const res = await fetch(`/api/supplier?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSupplier();
      }
    } catch (error) {
      console.error("Failed to delete supplier:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supplier</h1>
          <p className="text-gray-500">Manajemen data pemasok barang</p>
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
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editId ? "Edit Supplier" : "Tambah Supplier"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nama Supplier</label>
                <Input
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="PT. Supplier ABC"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telepon</label>
                <Input
                  value={form.telepon}
                  onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                  placeholder="08123456789"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Alamat</label>
                <textarea
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
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {editId ? "Update" : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Daftar Supplier
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : supplier.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada data supplier
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplier.map((s) => (
                <Card key={s.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Truck className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(s)}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{s.nama}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {s.telepon}
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 mt-0.5" />
                        <span className="line-clamp-2">{s.alamat}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
