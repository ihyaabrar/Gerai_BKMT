import Link from "next/link";
import { LogIn, ChevronDown } from "lucide-react";
import type { ProfilOrganisasiPublic } from "@/types/public-profile";

interface HeroSectionProps {
  profil: ProfilOrganisasiPublic | null;
}

export function HeroSection({ profil }: HeroSectionProps) {
  return (
    <section
      id="beranda"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 30%, #047857 60%, #059669 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-300/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/90 text-xs font-medium px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
          Organisasi Resmi Majelis Taklim Kabupaten Kubu Raya
        </div>

        {/* Logo */}
        {profil?.logoUrl && (
          <div className="mb-8">
            <img
              src={profil.logoUrl}
              alt="Logo BKMT"
              className="h-28 w-28 rounded-2xl object-cover mx-auto shadow-2xl border-4 border-white/20"
            />
          </div>
        )}

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 leading-tight tracking-tight">
          {profil?.singkatan || "PD BKMT"}
          <br />
          <span className="text-emerald-300">Kubu Raya</span>
        </h1>

        <p className="text-emerald-100/80 text-base md:text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
          {profil?.nama || "Pimpinan Daerah Badan Kontak Majelis Taklim Kabupaten Kubu Raya"}
        </p>

        {profil?.deskripsi && (
          <p className="text-white/70 text-sm md:text-base max-w-xl mx-auto mb-10 leading-relaxed">
            {profil.deskripsi}
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#profil"
            className="px-8 py-3.5 bg-white text-emerald-800 rounded-full font-semibold text-sm shadow-xl hover:shadow-2xl hover:bg-emerald-50 transition-all"
          >
            Tentang Kami
          </a>
          <Link
            href="/login"
            className="flex items-center gap-2 px-8 py-3.5 bg-white/10 backdrop-blur border border-white/30 text-white rounded-full font-semibold text-sm hover:bg-white/20 transition-all"
          >
            <LogIn className="h-4 w-4" />
            Login Kasir
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { value: "20", label: "Pimpinan Cabang" },
            { value: "130+", label: "Permata BKMT" },
            { value: "9", label: "Kecamatan" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-emerald-200 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
        <ChevronDown className="h-6 w-6" />
      </div>
    </section>
  );
}

// Visi Misi section terpisah
export function VisiMisiSection({ profil }: HeroSectionProps) {
  if (!profil?.visi && !profil?.misi && !profil?.sejarah) return null;

  return (
    <section id="profil" className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-emerald-600 text-sm font-semibold uppercase tracking-widest">Tentang Kami</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Profil Organisasi</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profil?.visi && (
            <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-5 shadow-md">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Visi</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{profil.visi}</p>
              </div>
            </div>
          )}
          {profil?.misi && (
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-5 shadow-md">
                  <span className="text-white text-xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Misi</h3>
                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{profil.misi}</p>
              </div>
            </div>
          )}
        </div>

        {profil?.sejarah && (
          <div className="mt-6 bg-gray-50 border border-gray-100 rounded-2xl p-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-5 shadow-md">
              <span className="text-white text-xl">📜</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Sejarah</h3>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{profil.sejarah}</p>
          </div>
        )}
      </div>
    </section>
  );
}
