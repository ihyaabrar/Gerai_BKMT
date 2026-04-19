"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Globe, LogOut, LayoutDashboard, FileText, Users, Store, Building2, ShoppingCart } from "lucide-react";
import { useAuthStore } from "@/store/auth";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Profil Organisasi", href: "/admin/profil" },
  { icon: FileText, label: "Berita", href: "/admin/berita" },
  { icon: Users, label: "Pengurus", href: "/admin/pengurus" },
  { icon: Store, label: "Info Gerai", href: "/admin/gerai" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    router.push("/login");
  };

  return (
    <aside className="w-60 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-800">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Admin Panel</p>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">BK</span>
          </div>
          <span className="font-bold text-sm text-white">BKMT Kubu Raya</span>
        </div>
      </div>

      {/* User */}
      {user && (
        <div className="mx-4 mt-4 p-3 bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{user.nama.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs text-white truncate">{user.nama}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                isActive
                  ? "bg-violet-600 text-white font-medium shadow-lg shadow-violet-900/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-gray-800 pt-3">
        <Link href="/app" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
          <ShoppingCart className="h-4 w-4" />
          Ke Sistem Kasir
        </Link>
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
          <Globe className="h-4 w-4" />
          Lihat Profil Publik
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
