"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ShoppingCart, Package, Wallet, Users, Settings,
  ChevronDown, LogOut, Globe, Shield, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useSidebar } from "@/components/layout/DashboardShell";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app" },
  { icon: ShoppingCart, label: "Kasir", href: "/app/kasir" },
  {
    icon: Package,
    label: "Inventori",
    submenu: [
      { label: "Ringkasan", href: "/app/inventori" },
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
      { label: "Ringkasan", href: "/app/keuangan" },
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
  const { open, close } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, canAccess } = useAuthStore();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // Buka otomatis submenu yang memuat halaman aktif, supaya pengguna
  // tidak kehilangan konteks setelah reload.
  useEffect(() => {
    const parent = menuItems.find(
      (item) => "submenu" in item && item.submenu?.some((s) => pathname === s.href)
    );
    if (parent) {
      setOpenMenus((prev) =>
        prev.includes(parent.label) ? prev : [...prev, parent.label]
      );
    }
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const isAdmin = user?.role === "master" || user?.role === "admin";

  return (
    <>
      {/* Latar gelap saat drawer terbuka di mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-brand-950/60 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          // Mobile: drawer melayang di atas konten.
          "fixed inset-y-0 left-0 z-50 w-[272px] max-w-[85vw] bg-brand-deep text-white",
          "flex flex-col transition-transform duration-200 ease-out shadow-panel",
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop: kolom tetap yang menempel saat halaman di-scroll.
          "lg:static lg:translate-x-0 lg:max-w-none lg:h-screen lg:sticky lg:top-0 lg:shrink-0"
        )}
      >
        {/* Identitas */}
        <div className="p-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gold-400 flex items-center justify-center shrink-0 shadow-lg">
              <span className="text-brand-950 font-extrabold text-xs tracking-tight">
                BKMT
              </span>
            </div>
            <div className="min-w-0 leading-tight">
              <p className="font-bold text-[15px] text-white truncate">Gerai BKMT</p>
              <p className="text-brand-300 text-[11px]">Kubu Raya</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Tutup menu navigasi"
            className="lg:hidden p-2 -mr-2 rounded-lg text-brand-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigasi */}
        <nav className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const hasSubmenu = "submenu" in item;
            const isOpen = openMenus.includes(item.label);
            const isSubmenuActive =
              hasSubmenu && item.submenu?.some((s) => pathname === s.href);

            if (hasSubmenu) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors",
                      isSubmenuActive
                        ? "bg-white/10 text-white"
                        : "text-brand-200 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform opacity-70",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {isOpen && item.submenu && (
                    <div className="mt-1 ml-5 space-y-0.5 border-l border-white/10 pl-3">
                      {item.submenu.map((sub) => {
                        if (!canAccess(sub.href)) return null;
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "block px-3 py-2 rounded-lg text-[13px] transition-colors",
                              isSubActive
                                ? "bg-brand-500 text-white font-semibold shadow-sm"
                                : "text-brand-300 hover:bg-white/5 hover:text-white"
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
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-950/40"
                    : "text-brand-200 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Slogan — aksen tulisan tangan seperti di desain */}
        <div className="mx-3 mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="font-script text-[17px] leading-tight text-gold-300">
            Bersama Umat,
            <br />
            Membangun Masyarakat
          </p>
        </div>

        {/* Akun & tautan bawah */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
          {user && (
            <div className="flex items-center gap-3 px-3.5 py-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">
                  {user.nama.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13px] text-white truncate">
                  {user.nama}
                </p>
                <p className="text-[11px] text-brand-300 capitalize">{user.role}</p>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-brand-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Globe className="h-4 w-4" />
            Lihat Profil Publik
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-white/10 text-white"
                  : "text-brand-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-brand-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
