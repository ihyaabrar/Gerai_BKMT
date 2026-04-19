import { MapPin, Phone, Clock, ShoppingBag, LogIn } from "lucide-react";
import Link from "next/link";
import type { InformasiGeraiPublic } from "@/types/public-profile";

interface GeraiSectionProps {
  gerai: InformasiGeraiPublic | null;
}

export function GeraiSection({ gerai }: GeraiSectionProps) {
  return (
    <section id="gerai" className="py-16 px-4 bg-emerald-800 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Gerai BKMT</h2>
          <p className="text-emerald-200">Unit usaha ekonomi produktif PD BKMT Kabupaten Kubu Raya</p>
        </div>

        {gerai ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h3 className="text-2xl font-bold">{gerai.nama}</h3>
              {gerai.deskripsi && (
                <p className="text-emerald-100 leading-relaxed">{gerai.deskripsi}</p>
              )}
              <div className="space-y-3">
                {gerai.alamat && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-emerald-300 mt-0.5 shrink-0" />
                    <span className="text-emerald-100">{gerai.alamat}</span>
                  </div>
                )}
                {gerai.telepon && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-emerald-300 shrink-0" />
                    <a href={`tel:${gerai.telepon}`} className="text-emerald-100 hover:text-white transition-colors">
                      {gerai.telepon}
                    </a>
                  </div>
                )}
                {gerai.jamOperasional && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-emerald-300 shrink-0" />
                    <span className="text-emerald-100">{gerai.jamOperasional}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <ShoppingBag className="h-8 w-8 text-emerald-300" />
                  <h4 className="text-lg font-bold">Sistem Kasir Digital</h4>
                </div>
                <p className="text-emerald-100 text-sm mb-6">
                  Gerai BKMT menggunakan sistem POS digital untuk pengelolaan penjualan, inventori, dan laporan keuangan secara terintegrasi.
                </p>
              </div>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 bg-white text-emerald-800 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
              >
                <LogIn className="h-5 w-5" />
                Login ke Sistem Kasir
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-emerald-400 opacity-50" />
            <p className="text-emerald-200 mb-6">Informasi gerai sedang dipersiapkan</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-emerald-800 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Login ke Sistem Kasir
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
