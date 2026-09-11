"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { isPublicPath, canAccessPath } from "@/lib/permissions";
import { Loader2 } from "lucide-react";

/** Selang verifikasi sesi ke server saat aplikasi sedang dibuka. */
const SELANG_VERIFIKASI_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, refresh } = useAuthStore();

  const publik = isPublicPath(pathname);
  const publikRef = useRef(publik);
  const publikSebelumnya = publikRef.current;
  publikRef.current = publik;

  /**
   * Verifikasi sesi: sekali saat aplikasi dibuka, lalu berkala dan setiap kali
   * tab kembali aktif.
   *
   * Sebelumnya verifikasi dijalankan pada SETIAP perpindahan halaman. Kasir
   * berpindah halaman puluhan kali sehari, dan setiap verifikasi yang gagal
   * karena sinyal drop tiga detik melempar mereka ke halaman login — di depan
   * pembeli. Middleware server sudah memeriksa cookie pada setiap request,
   * jadi verifikasi di sisi klien ini murni untuk tampilan, bukan keamanan.
   */
  useEffect(() => {
    const verifikasi = () => {
      if (!publikRef.current) refresh();
    };

    verifikasi();

    const timer = setInterval(verifikasi, SELANG_VERIFIKASI_MS);
    const saatTerlihat = () => {
      if (document.visibilityState === "visible") verifikasi();
    };
    document.addEventListener("visibilitychange", saatTerlihat);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, [refresh]);

  // Masuk ke area terproteksi dari halaman publik (mis. setelah login) tetap
  // diverifikasi sekali, tanpa menunggu selang berikutnya.
  useEffect(() => {
    if (publikSebelumnya && !publik) refresh();
  }, [publik, publikSebelumnya, refresh]);

  useEffect(() => {
    if (publik || status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!canAccessPath(user?.role, pathname)) {
      router.replace("/app");
    }
  }, [status, user, pathname, publik, router]);

  if (publik) {
    return <>{children}</>;
  }

  // Profil dari sesi sebelumnya masih tersimpan: tampilkan aplikasinya sambil
  // memverifikasi di latar, alih-alih menahan seluruh layar dengan spinner.
  // Kalau ternyata sesinya sudah tidak berlaku, efek di atas mengalihkan ke
  // halaman login — dan middleware server tetap penjaga sebenarnya.
  if (status === "loading" && user) {
    return <>{children}</>;
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return <>{children}</>;
}
