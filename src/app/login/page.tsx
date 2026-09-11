"use client";

import { useEffect, useState } from "react";
import { useIdentitasStore } from "@/store/identitas";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import { Lock, User, Loader2, LogIn, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        toast.success(`Selamat datang, ${data.user.nama}!`);
        // Hanya terima path internal supaya tidak bisa dipakai open redirect.
        const next = new URLSearchParams(window.location.search).get("next");
        const target =
          next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
        router.replace(target);
      } else {
        toast.error(data.error || "Login gagal");
      }
    } catch {
      toast.error("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  // Memakai store yang sama dengan sidebar supaya logonya diambil sekali saja.
  const logoUrl = useIdentitasStore((s) => s.logoUrl);
  const muatIdentitas = useIdentitasStore((s) => s.muat);

  useEffect(() => {
    muatIdentitas();
  }, [muatIdentitas]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Panel kiri — identitas, memakai ilustrasi masjid */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-hero border-r border-border p-12 relative overflow-hidden">
        <div className="relative flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gold-400 flex items-center justify-center">
              <span className="text-brand-950 font-extrabold text-[10px]">BKMT</span>
            </div>
          )}
          <div className="leading-tight">
            <p className="font-bold text-slate-900">PD BKMT Kubu Raya</p>
            <p className="text-xs text-slate-500">Bersama Umat, Membangun Masyarakat</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold text-slate-900 leading-tight tracking-tight">
            Sistem Kasir &amp;<br />
            <span className="text-brand-600">Inventori Gerai</span>
          </h1>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Kelola penjualan, stok barang, dan laporan keuangan Gerai BKMT secara
            efisien dan terintegrasi.
          </p>

          <ul className="mt-7 space-y-2.5">
            {[
              "Manajemen stok real-time",
              "Laporan keuangan otomatis",
              "Sistem bagi hasil nasabah",
              "Hak akses per peran",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                <span className="h-5 w-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 text-xs">
                  &#10003;
                </span>
                {f}
              </li>
            ))}
          </ul>

          <p className="mt-7 font-script text-xl text-brand-600">
            Umat Bersama, Masa Depan Lebih Baik
          </p>
        </div>

        <img
          src="/images/masjid.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -bottom-10 w-[420px] opacity-90 select-none"
        />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke halaman publik
          </Link>
        </div>
      </div>

      {/* Panel kanan — formulir */}
      <div className="flex items-center justify-center p-6 sm:p-8 bg-white min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke beranda
          </Link>

          <div className="lg:hidden flex items-center gap-3 mb-8">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gold-400 flex items-center justify-center">
                <span className="text-brand-950 font-extrabold text-[10px]">BKMT</span>
              </div>
            )}
            <div className="leading-tight">
              <p className="font-bold text-slate-900 text-sm">PD BKMT Kubu Raya</p>
              <p className="text-xs text-slate-500">Sistem Kasir &amp; Inventori</p>
            </div>
          </div>

          <div className="mb-7">
            <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
              Selamat datang
            </h2>
            <p className="text-slate-500 mt-1.5 text-sm">
              Masuk untuk mulai mengelola Gerai BKMT.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="login-username"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="login-username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Masukkan username"
                  required
                  disabled={loading}
                  autoFocus
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="login-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Masukkan password"
                  required
                  disabled={loading}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
              ) : (
                <><LogIn className="h-4 w-4 mr-2" /> Masuk</>
              )}
            </Button>
          </form>

          {/* Demo accounts — hanya tampil di luar produksi */}
          {process.env.NODE_ENV !== "production" && (
          <div className="mt-8 p-5 rounded-card border border-border bg-surface-muted">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Akun Demo</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ username: "admin", password: "admin123" })}
                className="p-3 bg-white hover:bg-brand-50 border border-border rounded-lg text-left transition-colors"
              >
                <p className="text-xs font-bold text-brand-700">Master</p>
                <p className="text-xs text-slate-500 mt-0.5">admin / admin123</p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ username: "kasir", password: "kasir123" })}
                className="p-3 bg-white hover:bg-brand-50 border border-border rounded-lg text-left transition-colors"
              >
                <p className="text-xs font-bold text-sky-700">Kasir</p>
                <p className="text-xs text-slate-500 mt-0.5">kasir / kasir123</p>
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
