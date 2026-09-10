import Link from "next/link";
import { LogIn, ArrowRight, Users, BookOpen, MapPin, HeartHandshake } from "lucide-react";
import type { ProfilOrganisasiPublic } from "@/types/public-profile";

interface HeroSectionProps {
  profil: ProfilOrganisasiPublic | null;
}

const STATISTIK = [
  {
    nilai: "20",
    label: "Pimpinan Cabang",
    sub: "PC di tingkat kecamatan",
    icon: Users,
  },
  {
    nilai: "130+",
    label: "Permata BKMT",
    sub: "Kelompok majelis taklim",
    icon: BookOpen,
  },
  {
    nilai: "9",
    label: "Kecamatan",
    sub: "di Kabupaten Kubu Raya",
    icon: MapPin,
  },
  {
    nilai: "Ribuan",
    label: "Anggota & Jamaah",
    sub: "Bersama membangun umat",
    icon: HeartHandshake,
  },
];

/** Judul besar: kata terakhir diberi warna aksen tanpa di-hardcode. */
function JudulOrganisasi({ teks }: { teks: string }) {
  const kata = teks.trim().split(/\s+/);
  const aksen = kata.length > 1 ? kata.pop() : null;
  return (
    <>
      {kata.join(" ")}
      {aksen && (
        <>
          {" "}
          <span className="text-brand-600">{aksen}</span>
        </>
      )}
    </>
  );
}

export function HeroSection({ profil }: HeroSectionProps) {
  const judul = profil?.singkatan || "PD BKMT Kubu Raya";

  return (
    <>
      <section id="beranda" className="relative overflow-hidden bg-brand-hero">
        {/* Ornamen lembut di latar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, #DDF2E4 0, transparent 45%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-16 lg:pt-32 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
                Organisasi Islam untuk Umat
              </p>

              <h1 className="mt-4 font-display text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                <JudulOrganisasi teks={judul} />
              </h1>

              <p className="mt-5 text-slate-600 text-base leading-relaxed">
                {profil?.deskripsi ||
                  profil?.nama ||
                  "Organisasi kemasyarakatan Islam yang menjadi wadah koordinasi dan pembinaan majelis taklim di Kabupaten Kubu Raya."}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#profil"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 h-11 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  Tentang Kami
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 h-11 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  <LogIn className="h-4 w-4" />
                  Login Kasir
                </Link>
              </div>

              <p className="mt-7 font-script text-2xl text-brand-600">
                Bersama Umat, Membangun Masyarakat
              </p>
            </div>

            {/* Ilustrasi + kutipan */}
            <div className="relative hidden lg:block w-[460px] shrink-0">
              <img
                src="/images/masjid.webp"
                alt=""
                aria-hidden="true"
                className="w-full select-none"
              />
              <blockquote className="absolute -top-2 -right-2 max-w-[190px] rounded-xl border border-border bg-white/90 backdrop-blur px-4 py-3 shadow-card">
                <p className="font-display text-sm leading-snug text-slate-800">
                  &ldquo;Majelis taklim kuat, masyarakat bermartabat.&rdquo;
                </p>
                <footer className="mt-1.5 text-[11px] text-slate-500">
                  {judul}
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Statistik */}
      <section className="bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATISTIK.map((s) => (
              <div
                key={s.label}
                className="rounded-card border border-border p-5 transition-colors hover:border-brand-300"
              >
                <span className="inline-flex h-10 w-10 rounded-xl bg-brand-50 text-brand-600 items-center justify-center">
                  <s.icon className="h-5 w-5" />
                </span>
                <p className="mt-3.5 text-2xl font-bold text-slate-900 tracking-tight">
                  {s.nilai}
                </p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {s.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

interface VisiMisiProps {
  profil: ProfilOrganisasiPublic | null;
}

export function VisiMisiSection({ profil }: VisiMisiProps) {
  if (!profil?.visi && !profil?.misi && !profil?.sejarah) return null;

  return (
    <section id="profil" className="bg-surface-muted">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
            Tentang Kami
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Profil Organisasi
          </h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            {profil?.nama}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {profil?.visi && (
            <article className="rounded-card border border-border bg-white p-6">
              <span className="inline-flex h-10 w-10 rounded-xl bg-brand-50 text-brand-600 items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Visi</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {profil.visi}
              </p>
            </article>
          )}

          {profil?.misi && (
            <article className="rounded-card border border-border bg-white p-6">
              <span className="inline-flex h-10 w-10 rounded-xl bg-gold-50 text-gold-600 items-center justify-center">
                <HeartHandshake className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Misi</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {profil.misi}
              </p>
            </article>
          )}

          {profil?.sejarah && (
            <article className="lg:col-span-2 rounded-card border border-border bg-white p-6">
              <span className="inline-flex h-10 w-10 rounded-xl bg-sky-50 text-sky-600 items-center justify-center">
                <Users className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Sejarah</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {profil.sejarah}
              </p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
