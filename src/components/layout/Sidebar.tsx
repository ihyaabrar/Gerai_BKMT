"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIdentitasStore } from "@/store/identitas";
import {
  Home, ShoppingCart, Package, Wallet, Contact, Settings, Clock, History,
  PackagePlus, Boxes, PackageX, Printer, MoreHorizontal, HelpCircle,
  ChevronDown, LogOut, Globe, Shield, X, type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useSidebar } from "@/components/layout/DashboardShell";

type MenuItem =
  | { icon: LucideIcon; label: string; href: string; submenu?: undefined }
  | { icon: LucideIcon; label: string; href?: undefined; submenu: { label: string; href: string }[] };

/**
 * Menu pengurus (master/admin). Nama menu memakai bahasa sehari-hari —
 * pemakainya relawan, bukan orang akuntansi.
 */
const menuPengurus: MenuItem[] = [
  { icon: Home, label: "Beranda", href: "/app" },
  { icon: ShoppingCart, label: "Kasir", href: "/app/kasir" },
  { icon: Clock, label: "Buka / Tutup Kasir", href: "/app/sistem/shift" },
  {
    icon: Package,
    label: "Barang",
    submenu: [
      { label: "Ringkasan Barang", href: "/app/inventori" },
      { label: "Barang Masuk", href: "/app/inventori/barang-masuk" },
      { label: "Stok Barang", href: "/app/inventori/stok" },
      { label: "Barang Rusak / Hilang", href: "/app/inventori/penyesuaian" },
      { label: "Retur ke Supplier", href: "/app/inventori/retur" },
    ],
  },
  {
    icon: Wallet,
    label: "Keuangan",
    submenu: [
      { label: "Ringkasan Keuangan", href: "/app/keuangan" },
      { label: "Riwayat Penjualan", href: "/app/keuangan/penjualan" },
      { label: "Pengeluaran", href: "/app/keuangan/pengeluaran" },
      { label: "Bagi Hasil Nasabah", href: "/app/keuangan/distribusi" },
      { label: "Laporan", href: "/app/keuangan/laporan" },
    ],
  },
  {
    icon: Contact,
    label: "Kontak",
    submenu: [
      { label: "Ringkasan Kontak", href: "/app/master" },
      { label: "Member (Pembeli)", href: "/app/master/member" },
      { label: "Nasabah (Pemodal)", href: "/app/master/nasabah" },
      { label: "Supplier (Pemasok)", href: "/app/master/supplier" },
    ],
  },
  {
    icon: Settings,
    label: "Pengaturan",
    submenu: [
      { label: "Ringkasan Pengaturan", href: "/app/sistem" },
      { label: "Printer", href: "/app/sistem/printer" },
      { label: "Pengguna", href: "/app/sistem/pengguna" },
      { label: "Pengaturan Toko", href: "/app/sistem/pengaturan" },
      { label: "Unduh Data (Excel)", href: "/app/sistem/backup" },
    ],
  },
  { icon: HelpCircle, label: "Cara Pakai", href: "/app/panduan" },
];

/**
 * Menu kasir: pekerjaan harian di atas, tanpa kelompok, supaya tidak perlu
 * membuka-buka submenu. Halaman yang jarang dipakai kasir dikumpulkan di
 * "Lainnya" — tetap bisa dibuka, hanya tidak memenuhi layar.
 */
const menuKasir: MenuItem[] = [
  { icon: Home, label: "Beranda", href: "/app" },
  { icon: ShoppingCart, label: "Kasir", href: "/app/kasir" },
  { icon: Clock, label: "Buka / Tutup Kasir", href: "/app/sistem/shift" },
  { icon: History, label: "Riwayat Penjualan", href: "/app/keuangan/penjualan" },
  { icon: PackagePlus, label: "Barang Masuk", href: "/app/inventori/barang-masuk" },
  { icon: Boxes, label: "Stok Barang", href: "/app/inventori/stok" },
  { icon: PackageX, label: "Barang Rusak / Hilang", href: "/app/inventori/penyesuaian" },
  { icon: Printer, label: "Printer", href: "/app/sistem/printer" },
  {
    icon: MoreHorizontal,
    label: "Lainnya",
    submenu: [
      { label: "Pengeluaran", href: "/app/keuangan/pengeluaran" },
      { label: "Retur ke Supplier", href: "/app/inventori/retur" },
      { label: "Member (Pembeli)", href: "/app/master/member" },
      { label: "Supplier (Pemasok)", href: "/app/master/supplier" },
    ],
  },
  { icon: HelpCircle, label: "Cara Pakai", href: "/app/panduan" },
];

export function Sidebar() {
  // Logo diambil di sisi klien: halaman ini dirender statis saat build, jadi
  // membacanya di server akan membekukan logo sampai deploy berikutnya.
  const logoUrl = useIdentitasStore((s) => s.logoUrl);
  const muatIdentitas = useIdentitasStore((s) => s.muat);
  useEffect(() => {
    muatIdentitas();
  }, [muatIdentitas]);


  const { open, close } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, canAccess } = useAuthStore();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const menuItems = user?.role === "kasir" ? menuKasir : menuPengurus;

  // Buka otomatis submenu yang memuat halaman aktif, supaya pengguna
  // tidak kehilangan konteks setelah reload.
  useEffect(() => {
    const parent = menuItems.find((item) =>
      item.submenu?.some((s) => pathname === s.href)
    );
    if (parent) {
      setOpenMenus((prev) =>
        prev.includes(parent.label) ? prev : [...prev, parent.label]
      );
    }
  }, [pathname, menuItems]);

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
          "flex flex-col transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop: kolom tetap yang menempel saat halaman di-scroll.
          "lg:static lg:translate-x-0 lg:max-w-none lg:h-screen lg:sticky lg:top-0 lg:shrink-0"
        )}
      >
        {/* Identitas */}
        <div className="p-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-xl object-cover shrink-0 bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gold-400 flex items-center justify-center shrink-0">
                <span className="text-brand-950 font-extrabold text-xs tracking-tight">
                  BKMT
                </span>
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <p className="font-bold text-[15px] text-white truncate">Gerai BKMT</p>
              <p className="text-brand-300 text-xs">Kubu Raya</p>
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
        <nav className="scroll-gelap flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const hasSubmenu = Boolean(item.submenu);
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
                                ? "bg-white/10 text-white font-semibold"
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

            if (!item.href || !canAccess(item.href)) return null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-brand-200 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Akun & tautan bawah */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
          {user && (
            // Menuju Akun Saya — satu-satunya tempat kasir bisa mengganti
            // passwordnya sendiri.
            <Link
              href="/app/akun"
              title="Akun saya & ganti password"
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 mb-1 rounded-xl transition-colors",
                pathname === "/app/akun" ? "bg-white/10" : "hover:bg-white/5"
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">
                  {user.nama.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13px] text-white truncate">
                  {user.nama}
                </p>
                <p className="text-xs text-brand-300">
                  <span className="capitalize">{user.role}</span> · Ganti password
                </p>
              </div>
            </Link>
          )}

          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-brand-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Globe className="h-4 w-4" />
            Lihat Situs Web
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              title="Ubah berita, pengurus, galeri, dan agenda di situs web"
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-white/10 text-white"
                  : "text-brand-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Shield className="h-4 w-4" />
              Kelola Situs Web
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
