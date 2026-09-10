import { create } from "zustand";
import { persist } from "zustand/middleware";
import { canAccessPath } from "@/lib/permissions";

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
        set({ user: null, isAuthenticated: false, status: "unauthenticated" });
      },

      refresh: async () => {
        try {
          const res = await fetch("/api/auth/me", { cache: "no-store" });
          if (!res.ok) {
            set({ user: null, isAuthenticated: false, status: "unauthenticated" });
            return null;
          }
          const data = await res.json();
          const user: AuthUser | null = data?.user ?? null;
          set({
            user,
            isAuthenticated: Boolean(user),
            status: user ? "authenticated" : "unauthenticated",
          });
          return user;
        } catch {
          set({ user: null, isAuthenticated: false, status: "unauthenticated" });
          return null;
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
