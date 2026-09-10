"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/store/auth";

const JUDUL: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/profil": "Profil Organisasi",
  "/admin/berita": "Berita & Pengumuman",
  "/admin/pengurus": "Pengurus",
  "/admin/gerai": "Informasi Gerai",
};

/**
 * Batang atas panel admin: konteks halaman, pencarian, dan identitas akun.
 *
 * Lonceng notifikasi pada desain sengaja tidak dipasang — belum ada sumber
 * data notifikasi, dan ikon yang tidak pernah berisi apa pun justru
 * menyesatkan.
 */
export function AdminTopbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const judul =
    JUDUL[pathname] ??
    Object.entries(JUDUL).find(
      ([href]) => href !== "/admin" && pathname.startsWith(href)
    )?.[1] ??
    "Admin Panel";

  return (
    <header className="hidden lg:flex sticky top-0 z-20 items-center gap-4 border-b border-border bg-white/85 backdrop-blur px-8 h-16">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-slate-400">
          Admin Panel
        </p>
        <p className="font-semibold text-slate-900 truncate leading-tight">{judul}</p>
      </div>

      <div className="relative ml-auto w-full max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          aria-label="Cari menu admin"
          placeholder="Cari menu, konten, atau fitur..."
          className="h-10 w-full rounded-lg border border-border bg-surface-muted pl-10 pr-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20"
          onChange={(e) => {
            const q = e.target.value.trim().toLowerCase();
            if (!q) return;
            const cocok = Object.entries(JUDUL).find(([, label]) =>
              label.toLowerCase().includes(q)
            );
            if (cocok && q.length >= 3) {
              // Navigasi ringan: cukup soroti tautan yang cocok di sidebar.
              document
                .querySelector<HTMLAnchorElement>(`a[href="${cocok[0]}"]`)
                ?.focus();
            }
          }}
        />
      </div>

      <Link
        href="/"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 h-10 text-sm font-medium text-slate-600 hover:bg-surface-sunken hover:text-slate-900 transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        Halaman Publik
      </Link>

      {user && (
        <div className="shrink-0 flex items-center gap-2.5 pl-4 border-l border-border">
          <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user.nama.charAt(0)}
            </span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">{user.nama}</p>
            <p className="text-[11px] text-slate-500 capitalize">{user.role}</p>
          </div>
        </div>
      )}
    </header>
  );
}
