import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Gerai BKMT - POS & Inventory",
  description: "Sistem Point of Sale dan Manajemen Inventori",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="font-sans">
        <AuthProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-8">{children}</main>
          </div>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
