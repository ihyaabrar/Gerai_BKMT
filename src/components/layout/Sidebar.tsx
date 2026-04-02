"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  Users,
  Settings,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: ShoppingCart, label: "Kasir", href: "/kasir" },
  {
    icon: Package,
    label: "Inventori",
    submenu: [
      { label: "Barang Masuk", href: "/inventori/barang-masuk" },
      { label: "Stok Barang", href: "/inventori/stok" },
      { label: "Penyesuaian", href: "/inventori/penyesuaian" },
      { label: "Retur", href: "/inventori/retur" },
    ],
  },
  {
    icon: Wallet,
    label: "Keuangan",
    submenu: [
      { label: "Penjualan", href: "/keuangan/penjualan" },
      { label: "Pengeluaran", href: "/keuangan/pengeluaran" },
      { label: "Distribusi Laba", href: "/keuangan/distribusi" },
      { label: "Laporan", href: "/keuangan/laporan", restricted: true },
    ],
  },
  {
    icon: Users,
    label: "Master Data",
    submenu: [
      { label: "Member", href: "/master/member" },
      { label: "Nasabah", href: "/master/nasabah" },
      { label: "Supplier", href: "/master/supplier" },
    ],
  },
  {
    icon: Settings,
    label: "Sistem",
    submenu: [
      { label: "Shift Kasir", href: "/sistem/shift" },
      { label: "Pengaturan", href: "/sistem/pengaturan", restricted: true },
      { label: "Backup", href: "/sistem/backup", restricted: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, canAccess } = useAuthStore();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // Don't show sidebar on login page
  if (pathname === "/login") return null;

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

  return (
    <aside className="w-64 bg-emerald-800 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Gerai BKMT</h1>
        <p className="text-emerald-200 text-sm">POS & Inventory</p>
      </div>

      {user && (
        <div className="mb-6 p-3 bg-emerald-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4" />
            <span className="font-semibold text-sm">{user.nama}</span>
          </div>
          <span className="text-xs text-emerald-200 capitalize">{user.role}</span>
        </div>
      )}

      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const hasSubmenu = "submenu" in item;
          const isOpen = openMenus.includes(item.label);

          if (hasSubmenu) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && item.submenu && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu.map((sub) => {
                      const canAccessItem = canAccess(sub.href);
                      if (!canAccessItem) return null;

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "block px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors",
                            pathname === sub.href && "bg-emerald-700"
                          )}
                        >
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
                "flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors",
                isActive && "bg-emerald-700"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors mt-4 border-t border-emerald-700 pt-4"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
