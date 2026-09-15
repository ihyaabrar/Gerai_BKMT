"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";

const NAMA_ROLE: Record<string, string> = {
  master: "Master",
  admin: "Admin",
  kasir: "Kasir",
};

/**
 * Halaman akun milik sendiri, terbuka untuk semua role.
 *
 * Sebelumnya satu-satunya tombol ganti password ada di halaman Pengguna —
 * yang tidak bisa dibuka kasir. Kasir yang diberi password awal oleh pengurus
 * tidak punya cara menggantinya sendiri.
 */
export default function AkunPage() {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({ passwordLama: "", passwordBaru: "", ulangi: "" });
  const [memproses, setMemproses] = useState(false);

  const gantiPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (memproses) return;
    if (form.passwordBaru !== form.ulangi) {
      toast.error("Ulangi password baru tidak sama");
      return;
    }
    setMemproses(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordLama: form.passwordLama,
          passwordBaru: form.passwordBaru,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Gagal mengganti password");
        return;
      }
      toast.success("Password berhasil diganti");
      setForm({ passwordLama: "", passwordBaru: "", ulangi: "" });
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setMemproses(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Akun Saya</h1>
        <p className="text-sm text-slate-500 mt-1">Data akun dan password Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <CardIcon icon={UserCircle} nada="brand" />
            Akun
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-slate-500">Nama</dt>
            <dd className="font-medium text-slate-900">{user?.nama ?? "—"}</dd>
            <dt className="text-slate-500">Username</dt>
            <dd className="font-medium text-slate-900">{user?.username ?? "—"}</dd>
            <dt className="text-slate-500">Peran</dt>
            <dd className="font-medium text-slate-900">
              {user ? NAMA_ROLE[user.role] ?? user.role : "—"}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <CardIcon icon={KeyRound} nada="brand" />
            Ganti Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={gantiPassword} className="space-y-4">
            <div>
              <label htmlFor="akun-lama" className="block text-sm font-medium text-slate-700">
                Password Saat Ini <span className="text-red-500">*</span>
              </label>
              <Input
                id="akun-lama"
                type="password"
                autoComplete="current-password"
                required
                value={form.passwordLama}
                onChange={(e) => setForm({ ...form, passwordLama: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="akun-baru" className="block text-sm font-medium text-slate-700">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <Input
                id="akun-baru"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.passwordBaru}
                onChange={(e) => setForm({ ...form, passwordBaru: e.target.value })}
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1.5">Minimal 8 karakter</p>
            </div>
            <div>
              <label htmlFor="akun-ulangi" className="block text-sm font-medium text-slate-700">
                Ulangi Password Baru <span className="text-red-500">*</span>
              </label>
              <Input
                id="akun-ulangi"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.ulangi}
                onChange={(e) => setForm({ ...form, ulangi: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <Button type="submit" disabled={memproses} className="w-full">
              {memproses ? "Memproses..." : "Ganti Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
