import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  nama: string;
  username: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  canAccess: (path: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      canAccess: (path: string) => {
        const { user } = get();
        if (!user) return false;
        
        // Master dapat akses semua
        if (user.role === "master" || user.role === "admin") return true;
        
        // Kasir tidak bisa akses laporan dan pengaturan
        if (user.role === "kasir") {
          const restrictedPaths = [
            "/app/keuangan/laporan",
            "/app/sistem/pengaturan",
            "/app/sistem/backup",
            "/admin",
          ];
          return !restrictedPaths.some((p) => path.startsWith(p));
        }
        
        return true;
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
