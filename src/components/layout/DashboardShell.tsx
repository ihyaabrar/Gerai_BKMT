"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

interface SidebarState {
  /** Hanya bermakna di bawah lg — di layar besar sidebar selalu tampil. */
  open: boolean;
  close: () => void;
}

const SidebarContext = createContext<SidebarState>({ open: false, close: () => {} });

/** Dipakai komponen sidebar untuk mengetahui status drawer di mobile. */
export function useSidebar() {
  return useContext(SidebarContext);
}

interface DashboardShellProps {
  /** Elemen sidebar; di-render di dalam provider agar bisa membaca konteks. */
  sidebar: React.ReactNode;
  /** Judul singkat di header mobile. */
  brand: string;
  /** Label kecil di atas judul, mis. "Admin Panel". */
  brandLabel?: string;
  /** Kelas Tailwind untuk gradient kotak inisial. */
  brandAccent?: string;
  children: React.ReactNode;
}

/**
 * Kerangka halaman untuk area kasir dan admin.
 *
 * Di bawah 1024px sidebar menjadi drawer yang dibuka lewat tombol menu.
 * Sebelumnya sidebar selalu selebar 240–256px tanpa breakpoint apa pun,
 * sehingga di layar HP konten utama hanya tersisa ~119px dan teksnya
 * saling tumpang tindih.
 */
export function DashboardShell({
  sidebar,
  brand,
  brandLabel,
  brandAccent = "bg-gold-400",
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Tutup drawer setiap kali pindah halaman.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Kunci scroll body selama drawer terbuka, dan sediakan tombol Escape.
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <SidebarContext.Provider value={{ open, close: () => setOpen(false) }}>
      {/*
        Tanpa ini pengguna keyboard harus menyusuri belasan item sidebar
        di setiap halaman sebelum sampai ke konten.
      */}
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-3 focus:left-3 focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Lewati ke konten utama
      </a>

      <div className="lg:flex">
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-brand-deep text-white px-4 h-14 shadow-lg">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu navigasi"
            aria-expanded={open}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 bg-gradient-to-br ${brandAccent} rounded-lg flex items-center justify-center shrink-0`}
            >
              <span className="text-white font-bold text-[10px]">BK</span>
            </div>
            <div className="min-w-0 leading-tight">
              {brandLabel && (
                <p className="text-[10px] text-brand-300 uppercase tracking-widest">
                  {brandLabel}
                </p>
              )}
              <p className="font-bold text-sm truncate">{brand}</p>
            </div>
          </div>
        </header>

        {sidebar}

        {/* min-w-0 mencegah konten lebar (tabel/grid) melebarkan flex container */}
        <main
          id="konten-utama"
          tabIndex={-1}
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 min-h-screen bg-surface-muted focus:outline-none"
        >
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
