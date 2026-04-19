import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";
import type { BeritaPublic } from "@/types/public-profile";

interface BeritaSectionProps {
  beritaList: BeritaPublic[];
}

export function BeritaSection({ beritaList }: BeritaSectionProps) {
  return (
    <section id="berita" className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Berita & Pengumuman</h2>
          <p className="text-gray-500">Informasi terbaru dari PD BKMT Kabupaten Kubu Raya</p>
        </div>

        {beritaList.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Newspaper className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Belum ada berita yang dipublikasikan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beritaList.slice(0, 6).map((berita) => (
              <Link
                key={berita.id}
                href={`/berita/${berita.slug}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100"
              >
                {berita.gambarUrl ? (
                  <img
                    src={berita.gambarUrl}
                    alt={berita.judul}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-emerald-400" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {berita.judul}
                  </h3>
                  {berita.ringkasan && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{berita.ringkasan}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {berita.tanggalPublikasi
                        ? format(new Date(berita.tanggalPublikasi), "d MMM yyyy", { locale: id })
                        : "-"}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium group-hover:gap-2 transition-all">
                      Baca <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
