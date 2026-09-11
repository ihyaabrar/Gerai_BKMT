import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { ambilIdentitas } from "@/lib/identitas";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logoUrl } = await ambilIdentitas();

  return (
    <AuthProvider>
      <DashboardShell
        brand="BKMT Kubu Raya"
        brandLabel="Admin Panel"
        brandAccent="bg-gold-400"
        logoUrl={logoUrl}
        sidebar={<AdminSidebar logoUrl={logoUrl} />}
        topbar={<AdminTopbar />}
      >
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
