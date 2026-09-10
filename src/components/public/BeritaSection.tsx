import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, ArrowRight, Newspaper, ArrowUpRight } from "lucide-react";
import type { BeritaPublic } from "@/types/public-profile";

interface BeritaSectionProps {
  beritaList: BeritaPublic[];
}

export function BeritaSection({ beritaList }: BeritaSectionProps) {
  const featured = beritaList[0];
  const rest = beritaList.slice(1, 6);

  /*
    Tata letak menyesuaikan jumlah berita. Sebelumnya selalu memakai
    grid 5 kolom (3 untuk berita utama + 2 untuk sidebar), sehingga
    dengan satu berita saja kolom kanan tampil kosong melompong.
  */
  const adaPendamping = rest.length > 0;

  return (
    <section id="berita" className="bg-surface-muted">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
              Informasi
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Berita &amp; Pengumuman
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Kegiatan, pengumuman, dan kabar terkini dari PD BKMT Kubu Raya.
            </p>
          </div>
          {beritaList.length > 1 && (
            <Link
              href={`/berita/${featured.slug}`}
              className="flex items-center gap-2 text-brand-600 font-medium text-sm hover:text-brand-700 transition-colors shrink-0"
            >
              Baca berita terbaru <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {beritaList.length === 0 ? (
          <div className="rounded-card border border-border bg-white text-center py-16">
            <div className="w-14 h-14 bg-surface-sunken border border-border rounded-xl flex items-center justify-center mx-auto mb-3">
              <Newspaper className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Belum ada berita</p>
            <p className="text-slate-400 text-sm mt-1">Berita akan segera hadir</p>
          </div>
        ) : (
          <div
            className={
              adaPendamping
                ? "grid grid-cols-1 lg:grid-cols-5 gap-6"
                : "max-w-3xl mx-auto"
            }
          >
            {/* Featured berita */}
            {featured && (
              <Link
                href={`/berita/${featured.slug}`}
                className={`${
                  adaPendamping ? "lg:col-span-3" : "block"
                } group relative overflow-hidden rounded-card bg-white border border-border hover:border-brand-300 transition-all`}
              >
                <div className="relative h-64 lg:h-80 overflow-hidden">
                  {featured.gambarUrl ? (
                    <img
                      src={featured.gambarUrl}
                      alt={featured.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    /* Tanpa gambar sendiri, dipakai foto kegiatan umum */
                    <img
                      src="/images/kegiatan-majelis-taklim.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      Terbaru
                    </span>
                    <h3 className="text-white font-bold text-xl leading-tight line-clamp-2 mb-2">
                      {featured.judul}
                    </h3>
                    <div className="flex items-center gap-3 text-white/70 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {featured.tanggalPublikasi
                          ? format(new Date(featured.tanggalPublikasi), "d MMM yyyy", { locale: id })
                          : "-"}
                      </span>
                      <span className="flex items-center gap-1 text-brand-300 font-medium group-hover:gap-2 transition-all">
                        Baca selengkapnya <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Berita pendamping — hanya dirender bila ada isinya */}
            {adaPendamping && (
            <div className="lg:col-span-2 flex flex-col gap-4">
              {rest.map((berita) => (
                <Link
                  key={berita.id}
                  href={`/berita/${berita.slug}`}
                  className="group flex gap-4 bg-white rounded-xl p-4 border border-border hover:border-brand-300 transition-all"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    {berita.gambarUrl ? (
                      <img
                        src={berita.gambarUrl}
                        alt={berita.judul}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <img
                        src="/images/kegiatan-majelis-taklim.webp"
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-brand-700 transition-colors leading-snug">
                      {berita.judul}
                    </h3>
                    <p className="text-slate-400 text-xs mt-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {berita.tanggalPublikasi
                        ? format(new Date(berita.tanggalPublikasi), "d MMM yyyy", { locale: id })
                        : "-"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
