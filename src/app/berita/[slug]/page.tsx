import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { gambarLebar, LEBAR } from "@/lib/gambar";
import { ambilIdentitas } from "@/lib/identitas";
import { PublicFooter } from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default async function BeritaDetailPage({ params }: Props) {
  const [berita, identitas, profil] = await Promise.all([
    prisma.berita
      .findFirst({
        where: { slug: params.slug, status: "published" },
        include: { penulis: { select: { nama: true } } },
      })
      .catch(() => null),
    ambilIdentitas(),
    prisma.profilOrganisasi.findFirst().catch(() => null),
  ]);

  if (!berita) notFound();

  return (
    <div className="min-h-screen bg-surface-muted">
      {/* Header sederhana */}
      <header className="bg-white border-b border-border py-3 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-brand-700 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            {identitas.logoUrl ? (
              <img
                src={identitas.logoUrl}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gold-400 flex items-center justify-center shrink-0">
                <span className="text-brand-950 font-extrabold text-[9px]">BKMT</span>
              </div>
            )}
            <span className="font-bold text-sm text-slate-900 truncate">
              {identitas.singkatan}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {berita.gambarUrl && (
          <img
            src={gambarLebar(berita.gambarUrl, LEBAR.besar)}
            alt={berita.judul}
            decoding="async"
            className="w-full h-64 md:h-80 object-cover rounded-xl mb-8 shadow-md"
          />
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
          {berita.judul}
        </h1>

        <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 pb-6 border-b border-gray-200">
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

        <div className="prose prose-emerald max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
          {/* Konten ditampilkan sebagai plain text — aman dari XSS */}
          {berita.konten}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link
            href="/#berita"
            className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-800 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Lihat berita lainnya
          </Link>
        </div>
      </main>

      <PublicFooter profil={profil} />
    </div>
  );
}
