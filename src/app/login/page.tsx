"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import { Store, Lock, User, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
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
    } catch (error) {
      toast.error("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Background — static gradient, no animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 animate-scaleIn">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Store className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Gerai BKMT
            </CardTitle>
            <p className="text-gray-600">Sistem POS & Inventory Management</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 animate-slideInRight">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                Username
              </label>
              <Input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Masukkan username"
                required
                disabled={loading}
                autoFocus
                className="h-11 transition-all-smooth focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2 animate-slideInRight" style={{ animationDelay: '0.1s' }}>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                Password
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Masukkan password"
                required
                disabled={loading}
                className="h-11 transition-all-smooth focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all-smooth animate-slideInRight"
              style={{ animationDelay: '0.2s' }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Login
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <p className="text-sm text-gray-600 text-center mb-4 font-medium">Demo Accounts:</p>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 hover-lift cursor-pointer transition-all-smooth"
                onClick={() => setForm({ username: "admin", password: "admin123" })}
              >
                <p className="text-xs font-semibold text-emerald-700 mb-1">Master</p>
                <p className="text-xs text-gray-600">admin / admin123</p>
              </div>
              <div 
                className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 hover-lift cursor-pointer transition-all-smooth"
                onClick={() => setForm({ username: "kasir", password: "kasir123" })}
              >
                <p className="text-xs font-semibold text-cyan-700 mb-1">Kasir</p>
                <p className="text-xs text-gray-600">kasir / kasir123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
