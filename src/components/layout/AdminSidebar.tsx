"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Globe, LogOut, LayoutDashboard, FileText, Users, Store, Building2, ShoppingCart } from "lucide-react";
import { useAuthStore } from "@/store/auth";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard Admin", href: "/admin" },
  { icon: Building2, label: "Profil Organisasi", href: "/admin/profil" },
  { icon: FileText, label: "Berita & Pengumuman", href: "/admin/berita" },
  { icon: Users, label: "Pengurus", href: "/admin/pengurus" },
  { icon: Store, label: "Informasi Gerai", href: "/admin/gerai" },
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
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Admin Panel</p>
        <h1 className="text-lg font-bold text-white">BKMT Kubu Raya</h1>
      </div>

      {user && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <p className="font-semibold text-sm">{user.nama}</p>
          <p className="text-xs text-gray-400 capitalize">{user.role}</p>
        </div>
      )}

      <nav className="space-y-1 flex-1">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-emerald-700 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-700 pt-3 mt-3 space-y-1">
        <Link
          href="/app"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ShoppingCart className="h-4 w-4" />
          Ke Sistem Kasir
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Globe className="h-4 w-4" />
          Lihat Profil Publik
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-red-700 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
