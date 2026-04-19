import { MapPin, Phone, Clock, ShoppingBag, LogIn, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { InformasiGeraiPublic } from "@/types/public-profile";

interface GeraiSectionProps {
  gerai: InformasiGeraiPublic | null;
}

export function GeraiSection({ gerai }: GeraiSectionProps) {
  return (
    <section id="gerai" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-emerald-600 text-sm font-semibold uppercase tracking-widest">Unit Usaha</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Gerai BKMT</h2>
          <p className="text-gray-500 mt-3">Unit usaha ekonomi produktif PD BKMT Kabupaten Kubu Raya</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Info gerai */}
          <div className="space-y-6">
            {gerai ? (
              <>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{gerai.nama}</h3>
                  {gerai.deskripsi && (
                    <p className="text-gray-600 leading-relaxed">{gerai.deskripsi}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {gerai.alamat && (
                    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-0.5">Alamat</p>
                        <p className="text-gray-700 text-sm">{gerai.alamat}</p>
                      </div>
                    </div>
                  )}
                  {gerai.telepon && (
                    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-0.5">Telepon</p>
                        <a href={`tel:${gerai.telepon}`} className="text-gray-700 text-sm hover:text-emerald-600 transition-colors">
                          {gerai.telepon}
                        </a>
                      </div>
                    </div>
                  )}
                  {gerai.jamOperasional && (
                    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-0.5">Jam Operasional</p>
                        <p className="text-gray-700 text-sm">{gerai.jamOperasional}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 bg-white rounded-2xl border border-gray-100 text-center">
                <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">Informasi gerai sedang dipersiapkan</p>
              </div>
            )}
          </div>

          {/* CTA Card */}
          <div
            className="relative overflow-hidden rounded-3xl p-8 text-white"
            style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)" }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                <ShoppingBag className="h-7 w-7 text-emerald-300" />
              </div>

              <h4 className="text-2xl font-bold mb-3">Sistem Kasir Digital</h4>
              <p className="text-emerald-100/80 text-sm leading-relaxed mb-8">
                Gerai BKMT menggunakan sistem POS digital modern untuk pengelolaan penjualan, inventori, dan laporan keuangan secara terintegrasi dan efisien.
              </p>

              <div className="space-y-3 mb-8">
                {["Manajemen stok real-time", "Laporan keuangan otomatis", "Sistem bagi hasil nasabah"].map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-emerald-100">
                    <div className="w-5 h-5 bg-emerald-400/30 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-emerald-300 text-xs">✓</span>
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full bg-white text-emerald-800 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-all shadow-lg"
              >
                <LogIn className="h-4 w-4" />
                Login ke Sistem Kasir
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
