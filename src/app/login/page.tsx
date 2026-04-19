"use client";

import { useState } from "react";
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
        router.push("/app");
      } else {
        toast.error(data.error || "Login gagal");
      }
    } catch {
      toast.error("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)" }}
      >
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">BK</span>
            </div>
            <span className="text-white font-bold text-lg">BKMT Kubu Raya</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Sistem POS &<br />
            <span className="text-emerald-300">Inventory Digital</span>
          </h1>
          <p className="text-emerald-100/70 text-base leading-relaxed mb-8">
            Kelola penjualan, stok barang, dan laporan keuangan Gerai BKMT secara efisien dan terintegrasi.
          </p>
          <div className="space-y-3">
            {["Manajemen stok real-time", "Laporan keuangan otomatis", "Sistem bagi hasil nasabah", "Multi-role access"].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-emerald-100">
                <div className="w-5 h-5 bg-emerald-400/30 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-emerald-300 text-xs">✓</span>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Back to public */}
        <div className="relative">
          <Link href="/" className="flex items-center gap-2 text-emerald-200/70 hover:text-white text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke halaman publik
          </Link>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile back link */}
          <Link href="/" className="lg:hidden flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke beranda
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Selamat datang</h2>
            <p className="text-gray-500 mt-2">Masuk ke sistem kasir Gerai BKMT</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Masukkan username"
                  required
                  disabled={loading}
                  autoFocus
                  className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Masukkan password"
                  required
                  disabled={loading}
                  className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
              ) : (
                <><LogIn className="h-4 w-4 mr-2" /> Masuk</>
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Akun Demo</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ username: "admin", password: "admin123" })}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-left transition-colors"
              >
                <p className="text-xs font-bold text-emerald-700">Master</p>
                <p className="text-xs text-gray-500 mt-0.5">admin / admin123</p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ username: "kasir", password: "kasir123" })}
                className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl text-left transition-colors"
              >
                <p className="text-xs font-bold text-blue-700">Kasir</p>
                <p className="text-xs text-gray-500 mt-0.5">kasir / kasir123</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
