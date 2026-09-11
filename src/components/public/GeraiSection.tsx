import { MapPin, Phone, Clock, ShoppingBag, LogIn, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { InformasiGeraiPublic } from "@/types/public-profile";

interface GeraiSectionProps {
  gerai: InformasiGeraiPublic | null;
}

export function GeraiSection({ gerai }: GeraiSectionProps) {
  return (
    <section id="gerai" className="bg-surface-muted">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        <div className="max-w-xl mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
            Unit Usaha
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Produk Umat untuk Kebaikan Bersama
          </h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Unit usaha ekonomi produktif PD BKMT Kabupaten Kubu Raya.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Info gerai */}
          <div className="space-y-6">
            {gerai ? (
              <>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{gerai.nama}</h3>
                  {gerai.deskripsi && (
                    <p className="text-slate-600 leading-relaxed">{gerai.deskripsi}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {gerai.alamat && (
                    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-border">
                      <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-0.5">Alamat</p>
                        <p className="text-slate-700 text-sm">{gerai.alamat}</p>
                      </div>
                    </div>
                  )}
                  {gerai.telepon && (
                    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-border">
                      <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                        <Phone className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-0.5">Telepon</p>
                        <a href={`tel:${gerai.telepon}`} className="text-slate-700 text-sm hover:text-brand-600 transition-colors">
                          {gerai.telepon}
                        </a>
                      </div>
                    </div>
                  )}
                  {gerai.jamOperasional && (
                    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-border">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-0.5">Jam Operasional</p>
                        <p className="text-slate-700 text-sm">{gerai.jamOperasional}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 bg-white rounded-card border border-border text-center">
                <ShoppingBag className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">Informasi gerai sedang dipersiapkan</p>
              </div>
            )}
          </div>

          {/* Foto produk + ajakan masuk kasir */}
          <div className="rounded-card border border-border bg-white overflow-hidden">
            <div className="bg-brand-hero px-6 pt-6">
              <img
                src="/images/produk-gerai.webp"
                alt="Produk unggulan Gerai BKMT: madu hutan, teh herbal, kopi, dan keripik pisang"
                className="w-full max-w-sm mx-auto"
              />
            </div>

            <div className="p-6">
              <h4 className="text-lg font-bold text-slate-900">
                Produk berkualitas dari umat, untuk umat
              </h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Gerai BKMT dikelola dengan sistem kasir digital agar penjualan,
                stok, dan bagi hasil tercatat rapi dan transparan.
              </p>

              <ul className="mt-5 space-y-2.5">
                {[
                  "Manajemen stok real-time",
                  "Laporan keuangan otomatis",
                  "Sistem bagi hasil nasabah",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <span className="h-5 w-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 text-xs">
                      &#10003;
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className="mt-6 inline-flex items-center justify-center gap-2 w-full rounded-lg bg-brand-600 px-5 h-11 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <LogIn className="h-4 w-4" />
                Login ke Sistem Kasir
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
