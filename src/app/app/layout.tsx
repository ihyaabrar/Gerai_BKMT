import { DashboardShell } from "@/components/layout/DashboardShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { ambilIdentitas } from "@/lib/identitas";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logoUrl } = await ambilIdentitas();

  return (
    <AuthProvider>
      <DashboardShell
        brand="Gerai BKMT"
        logoUrl={logoUrl}
        sidebar={<Sidebar logoUrl={logoUrl} />}
      >
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
