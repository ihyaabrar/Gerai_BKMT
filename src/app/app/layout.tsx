import { DashboardShell } from "@/components/layout/DashboardShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider } from "@/components/layout/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell brand="Gerai BKMT" sidebar={<Sidebar />}>
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
