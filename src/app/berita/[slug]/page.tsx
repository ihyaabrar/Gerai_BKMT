import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default async function BeritaDetailPage({ params }: Props) {
  const berita = await prisma.berita.findFirst({
    where: { slug: params.slug, status: "published" },
    include: { penulis: { select: { nama: true } } },
  }).catch(() => null);

  if (!berita) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sederhana */}
      <header className="bg-emerald-800 text-white py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-emerald-200 hover:text-white transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {berita.gambarUrl && (
          <img
            src={berita.gambarUrl}
            alt={berita.judul}
            className="w-full h-64 md:h-80 object-cover rounded-xl mb-8 shadow-md"
          />
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {berita.judul}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-200">
          {berita.tanggalPublikasi && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(berita.tanggalPublikasi), "d MMMM yyyy", { locale: id })}
            </span>
          )}
          {berita.penulis && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {berita.penulis.nama}
            </span>
          )}
        </div>

        <div className="prose prose-emerald max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
          {berita.konten}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link
            href="/#berita"
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Lihat berita lainnya
          </Link>
        </div>
      </main>
    </div>
  );
}
