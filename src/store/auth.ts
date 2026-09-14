import { create } from "zustand";
import { persist } from "zustand/middleware";
import { canAccessPath } from "@/lib/permissions";
import { useCartStore } from "@/store/cart";

export interface AuthUser {
  id: string;
  nama: string;
  username: string;
  role: string;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  /** Verifikasi sesi ke server — sumber kebenaran sesungguhnya. */
  refresh: () => Promise<AuthUser | null>;
  canAccess: (path: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: "loading",
      isAuthenticated: false,

      login: (user) => set({ user, isAuthenticated: true, status: "authenticated" }),

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // tetap bersihkan state lokal walau request gagal
        }
        // Keranjang (beserta kunci transaksinya) tersimpan di perangkat. Tanpa
        // ini, kasir berikutnya di HP yang sama mewarisi keranjang orang lain.
        useCartStore.getState().clearCart();
        set({ user: null, isAuthenticated: false, status: "unauthenticated" });
      },

      refresh: async () => {
        /**
         * Mempertahankan keadaan sekarang. Dipakai saat server atau jaringan
         * bermasalah — itu bukan bukti bahwa sesinya tidak valid.
         */
        const pertahankan = () => {
          const user = get().user;
          set({
            isAuthenticated: Boolean(user),
            status: user ? "authenticated" : "unauthenticated",
          });
          return user;
        };

        try {
          const res = await fetch("/api/auth/me", { cache: "no-store" });

          // Hanya penolakan tegas dari server yang boleh melogout.
          if (res.status === 401 || res.status === 403) {
            set({ user: null, isAuthenticated: false, status: "unauthenticated" });
            return null;
          }

          // 5xx dan sejenisnya: servernya yang bermasalah, bukan sesinya.
          if (!res.ok) return pertahankan();

          const data = await res.json();
          const user: AuthUser | null = data?.user ?? null;
          set({
            user,
            isAuthenticated: Boolean(user),
            status: user ? "authenticated" : "unauthenticated",
          });
          return user;
        } catch {
          // `fetch` melempar berarti koneksi putus — dan kasir sedang berdiri
          // di depan pembeli. Versi sebelumnya memperlakukan ini sama dengan
          // "sesi tidak valid" dan melempar mereka ke halaman login, padahal
          // cookie sesinya masih berlaku 12 jam.
          return pertahankan();
        }
      },

      canAccess: (path) => canAccessPath(get().user?.role, path),
    }),
    {
      name: "auth-storage",
      // Hanya cache profil untuk menghindari kedipan UI.
      // Otorisasi tetap ditentukan server lewat cookie bertanda tangan.
      partialize: (state) => ({ user: state.user }),
    }
  )
);
