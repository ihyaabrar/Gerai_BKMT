import type { ProfilOrganisasiPublic } from "@/types/public-profile";

interface HeroSectionProps {
  profil: ProfilOrganisasiPublic | null;
}

export function HeroSection({ profil }: HeroSectionProps) {
  return (
    <section id="profil" className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {profil?.logoUrl && (
          <img
            src={profil.logoUrl}
            alt="Logo BKMT"
            className="h-24 w-24 rounded-full object-cover mx-auto mb-6 border-4 border-white/30 shadow-xl"
          />
        )}
        <h1 className="text-3xl md:text-5xl font-bold mb-2">
          {profil?.singkatan || "PD BKMT"}
        </h1>
        <h2 className="text-lg md:text-xl text-emerald-200 mb-6">
          {profil?.nama || "Pimpinan Daerah Badan Kontak Majelis Taklim Kabupaten Kubu Raya"}
        </h2>
        {profil?.deskripsi && (
          <p className="text-emerald-100 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            {profil.deskripsi}
          </p>
        )}

        {/* Visi & Misi */}
        {(profil?.visi || profil?.misi) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 text-left">
            {profil.visi && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="text-2xl">🎯</span> Visi
                </h3>
                <p className="text-emerald-100 text-sm leading-relaxed">{profil.visi}</p>
              </div>
            )}
            {profil.misi && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="text-2xl">🚀</span> Misi
                </h3>
                <p className="text-emerald-100 text-sm leading-relaxed whitespace-pre-line">{profil.misi}</p>
              </div>
            )}
          </div>
        )}

        {!profil && (
          <div className="bg-white/10 rounded-xl p-8 mt-6">
            <p className="text-emerald-200">Informasi profil organisasi sedang dipersiapkan.</p>
          </div>
        )}
      </div>
    </section>
  );
}
