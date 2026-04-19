"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ShoppingCart, Package, Wallet, Users, Settings,
  ChevronDown, LogOut, Globe, Shield, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app" },
  { icon: ShoppingCart, label: "Kasir", href: "/app/kasir" },
  {
    icon: Package,
    label: "Inventori",
    submenu: [
      { label: "Barang Masuk", href: "/app/inventori/barang-masuk" },
      { label: "Stok Barang", href: "/app/inventori/stok" },
      { label: "Penyesuaian", href: "/app/inventori/penyesuaian" },
      { label: "Retur", href: "/app/inventori/retur" },
    ],
  },
  {
    icon: Wallet,
    label: "Keuangan",
    submenu: [
      { label: "Penjualan", href: "/app/keuangan/penjualan" },
      { label: "Pengeluaran", href: "/app/keuangan/pengeluaran" },
      { label: "Distribusi Laba", href: "/app/keuangan/distribusi" },
      { label: "Laporan", href: "/app/keuangan/laporan", restricted: true },
    ],
  },
  {
    icon: Users,
    label: "Master Data",
    submenu: [
      { label: "Member", href: "/app/master/member" },
      { label: "Nasabah", href: "/app/master/nasabah" },
      { label: "Supplier", href: "/app/master/supplier" },
    ],
  },
  {
    icon: Settings,
    label: "Sistem",
    submenu: [
      { label: "Shift Kasir", href: "/app/sistem/shift" },
      { label: "Pengaturan", href: "/app/sistem/pengaturan", restricted: true },
      { label: "Backup", href: "/app/sistem/backup", restricted: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, canAccess } = useAuthStore();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    router.push("/login");
  };

  const isAdmin = user?.role === "master" || user?.role === "admin";

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xs">BK</span>
          </div>
          <div>
            <p className="font-bold text-sm text-white">Gerai BKMT</p>
            <p className="text-gray-500 text-xs">POS & Inventory</p>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="mx-4 mt-4 p-3 bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{user.nama.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">{user.nama}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const hasSubmenu = "submenu" in item;
          const isOpen = openMenus.includes(item.label);
          const isSubmenuActive = hasSubmenu && item.submenu?.some((s) => pathname === s.href);

          if (hasSubmenu) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors",
                    isSubmenuActive
                      ? "bg-emerald-600/20 text-emerald-400"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && item.submenu && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-800 pl-3">
                    {item.submenu.map((sub) => {
                      if (!canAccess(sub.href)) return null;
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                            isSubActive
                              ? "bg-emerald-600 text-white font-medium"
                              : "text-gray-500 hover:bg-gray-800 hover:text-white"
                          )}
                        >
                          <ChevronRight className="h-3 w-3" />
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                isActive
                  ? "bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-900/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-gray-800 pt-3">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
          <Globe className="h-4 w-4" />
          Lihat Profil Publik
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors",
              pathname.startsWith("/admin")
                ? "bg-violet-600/20 text-violet-400"
                : "text-gray-500 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Shield className="h-4 w-4" />
            Admin Panel
          </Link>
        )}
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
