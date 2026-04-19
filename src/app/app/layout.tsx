import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider } from "@/components/layout/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 min-h-screen bg-gray-50">{children}</main>
      </div>
    </AuthProvider>
  );
}
