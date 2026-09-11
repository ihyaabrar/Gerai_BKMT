import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lora, Caveat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

/*
  Tiga peran huruf sesuai desain:
  - sans    : seluruh antarmuka aplikasi (dashboard, kasir, admin)
  - display : judul besar halaman publik
  - script  : slogan "Umat Bersama, Masa Depan Lebih Baik"
*/
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const display = Lora({
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700"],
  variable: "--font-display",
});

const script = Caveat({
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700"],
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "PD BKMT Kubu Raya",
  description:
    "Badan Kontak Majelis Taklim Kabupaten Kubu Raya — Bersama Umat, Membangun Masyarakat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`scroll-smooth ${sans.variable} ${display.variable} ${script.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
