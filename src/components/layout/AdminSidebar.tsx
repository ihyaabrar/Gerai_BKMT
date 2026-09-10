"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Globe, LogOut, LayoutDashboard, FileText, Users, Store, Building2, ShoppingCart, X } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useSidebar } from "@/components/layout/DashboardShell";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Profil Organisasi", href: "/admin/profil" },
  { icon: FileText, label: "Berita", href: "/admin/berita" },
  { icon: Users, label: "Pengurus", href: "/admin/pengurus" },
  { icon: Store, label: "Info Gerai", href: "/admin/gerai" },
];

export function AdminSidebar() {
  const { open, close } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <>
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 max-w-[85vw] bg-white border-r border-border text-slate-700",
          "flex flex-col transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:translate-x-0 lg:max-w-none lg:h-screen lg:sticky lg:top-0 lg:shrink-0"
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Admin Panel</p>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup menu navigasi"
              className="lg:hidden p-2 -mt-2 -mr-2 rounded-lg text-slate-400 hover:bg-surface-sunken hover:text-slate-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-gold-400 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-brand-950 font-extrabold text-[10px]">BKMT</span>
            </div>
            <span className="font-bold text-sm text-slate-900 truncate">
              PD BKMT Kubu Raya
            </span>
          </div>
        </div>

      {/* User */}
      {user && (
        <div className="mx-4 mt-4 p-3 bg-surface-sunken rounded-xl border border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{user.nama.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs text-slate-900 truncate">{user.nama}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-600 hover:bg-surface-sunken hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-3">
        <Link href="/app" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-slate-500 hover:bg-surface-sunken hover:text-slate-900 transition-colors">
          <ShoppingCart className="h-4 w-4" />
          Ke Sistem Kasir
        </Link>
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-slate-500 hover:bg-surface-sunken hover:text-slate-900 transition-colors">
          <Globe className="h-4 w-4" />
          Lihat Profil Publik
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
      </aside>
    </>
  );
}
