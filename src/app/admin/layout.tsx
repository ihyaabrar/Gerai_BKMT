import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AuthProvider } from "@/components/layout/AuthProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-8 bg-gray-50">{children}</main>
      </div>
    </AuthProvider>
  );
}
