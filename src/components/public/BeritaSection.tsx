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

  return (
    <section id="berita" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-emerald-600 text-sm font-semibold uppercase tracking-widest">Informasi</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Berita & Pengumuman</h2>
          </div>
          {beritaList.length > 0 && (
            <Link
              href="#berita"
              className="flex items-center gap-2 text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors shrink-0"
            >
              Lihat semua <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {beritaList.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Newspaper className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-400 text-lg font-medium">Belum ada berita</p>
            <p className="text-gray-300 text-sm mt-1">Berita akan segera hadir</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Featured berita */}
            {featured && (
              <Link
                href={`/berita/${featured.slug}`}
                className="lg:col-span-3 group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all"
              >
                <div className="relative h-64 lg:h-80 overflow-hidden">
                  {featured.gambarUrl ? (
                    <img
                      src={featured.gambarUrl}
                      alt={featured.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <Newspaper className="h-16 w-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
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
                      <span className="flex items-center gap-1 text-emerald-300 font-medium group-hover:gap-2 transition-all">
                        Baca selengkapnya <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Rest berita */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {rest.map((berita) => (
                <Link
                  key={berita.id}
                  href={`/berita/${berita.slug}`}
                  className="group flex gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    {berita.gambarUrl ? (
                      <img
                        src={berita.gambarUrl}
                        alt={berita.judul}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <Newspaper className="h-6 w-6 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-emerald-700 transition-colors leading-snug">
                      {berita.judul}
                    </h3>
                    <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {berita.tanggalPublikasi
                        ? format(new Date(berita.tanggalPublikasi), "d MMM yyyy", { locale: id })
                        : "-"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
