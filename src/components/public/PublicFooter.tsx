import type React from "react";
import { Facebook, Globe, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";
import type { ProfilOrganisasiPublic } from "@/types/public-profile";
import { labelTautan, tautanSosial, tautanTelepon, type JenisSosial } from "@/lib/sosial";

export const SLOGAN_BAWAAN = "Bersama Umat, Membangun Masyarakat";

const NAVIGASI = [
  { label: "Beranda", href: "/#beranda" },
  { label: "Profil", href: "/#profil" },
  { label: "Berita", href: "/#berita" },
  { label: "Pengurus", href: "/#pengurus" },
  { label: "Galeri & Agenda", href: "/#galeri" },
  { label: "Gerai", href: "/#gerai" },
];

/** lucide-react belum punya ikon TikTok. */
function IkonTiktok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.6c.27 0 .53.04.77.12V9.77a5.7 5.7 0 0 0-.77-.05A5.69 5.69 0 1 0 15.55 15.4V9.06a7.36 7.36 0 0 0 4.3 1.38V7.35a4.3 4.3 0 0 1-3.25-1.53Z" />
    </svg>
  );
}

const SOSIAL: { jenis: JenisSosial; label: string; Ikon: React.ComponentType<{ className?: string }> }[] = [
  { jenis: "facebook", label: "Facebook", Ikon: Facebook },
  { jenis: "instagram", label: "Instagram", Ikon: Instagram },
  { jenis: "tiktok", label: "TikTok", Ikon: IkonTiktok },
  { jenis: "youtube", label: "YouTube", Ikon: Youtube },
];

/**
 * Bagian bawah situs publik. Seluruh isinya diambil dari Kelola Situs Web →
 * Profil Organisasi; isian yang kosong tidak ditampilkan.
 */
export function PublicFooter({ profil }: { profil: ProfilOrganisasiPublic | null }) {
  const telepon = tautanTelepon(profil?.telepon);
  const whatsapp = tautanSosial("whatsapp", profil?.whatsapp);
  const website = tautanSosial("website", profil?.website);
  const sosial = SOSIAL.map((s) => ({ ...s, href: tautanSosial(s.jenis, profil?.[s.jenis]) })).filter(
    (s) => s.href
  );
  const peta = profil?.alamat
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profil.alamat)}`
    : null;

  const adaKontak = Boolean(profil?.alamat || telepon || whatsapp || profil?.email || website);

  return (
    <footer className="bg-brand-deep text-brand-200">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3 font-display">
              {profil?.singkatan || "PD BKMT"}
            </h3>
            <p className="text-brand-200/80 text-sm leading-relaxed">
              {profil?.deskripsi || "Pimpinan Daerah Badan Kontak Majelis Taklim Kabupaten Kubu Raya"}
            </p>
            {sosial.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {sosial.map(({ jenis, label, Ikon, href }) => (
                  <a
                    key={jenis}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-gold-400 hover:text-brand-950 transition-colors"
                  >
                    <Ikon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Navigasi</h4>
            <div className="space-y-2">
              {NAVIGASI.map((n) => (
                <a key={n.href} href={n.href} className="block text-brand-200/80 hover:text-white text-sm transition-colors">
                  {n.label}
                </a>
              ))}
            </div>
          </div>

          {adaKontak && (
            <div>
              <h4 className="text-white font-semibold mb-3">Kontak</h4>
              <ul className="space-y-3 text-sm text-brand-200/80">
                {profil?.alamat && (
                  <li className="flex gap-2.5">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gold-300" />
                    <a href={peta!} target="_blank" rel="noopener noreferrer" className="hover:text-white break-words">
                      {profil.alamat}
                    </a>
                  </li>
                )}
                {telepon && (
                  <li className="flex gap-2.5">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0 text-gold-300" />
                    <a href={telepon} className="hover:text-white">{profil?.telepon}</a>
                  </li>
                )}
                {whatsapp && (
                  <li className="flex gap-2.5">
                    <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-gold-300" />
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                      WhatsApp {profil?.whatsapp}
                    </a>
                  </li>
                )}
                {profil?.email && (
                  <li className="flex gap-2.5">
                    <Mail className="h-4 w-4 mt-0.5 shrink-0 text-gold-300" />
                    <a href={`mailto:${profil.email}`} className="hover:text-white break-all">{profil.email}</a>
                  </li>
                )}
                {website && (
                  <li className="flex gap-2.5">
                    <Globe className="h-4 w-4 mt-0.5 shrink-0 text-gold-300" />
                    <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-white break-all">
                      {labelTautan(website)}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-center">
          <p className="text-brand-300/70 text-sm">
            © {new Date().getFullYear()} {profil?.singkatan || "PD BKMT Kabupaten Kubu Raya"}
          </p>
          <p className="font-script text-lg text-gold-300">{profil?.slogan?.trim() || SLOGAN_BAWAAN}</p>
          <a href="/login" className="text-gold-300 hover:text-gold-200 text-sm font-medium transition-colors">
            Masuk Pengurus →
          </a>
        </div>
      </div>
    </footer>
  );
}
