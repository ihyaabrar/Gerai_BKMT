import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AuthProvider } from "@/components/layout/AuthProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell
        brand="BKMT Kubu Raya"
        brandLabel="Admin Panel"
        brandAccent="bg-gold-400"
        sidebar={<AdminSidebar />}
      >
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
