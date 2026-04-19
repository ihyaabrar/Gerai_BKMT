import { prisma } from "@/lib/prisma";
import { sortPengurus, filterPublishedBerita } from "@/lib/utils";
import { PublicHeader } from "@/components/public/PublicHeader";
import { HeroSection, VisiMisiSection } from "@/components/public/HeroSection";
import { BeritaSection } from "@/components/public/BeritaSection";
import { PengurusSection } from "@/components/public/PengurusSection";
import { GeraiSection } from "@/components/public/GeraiSection";
import type { PengurusPublic, BeritaPublic } from "@/types/public-profile";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage() {
  // Fetch semua data langsung dari Prisma (Server Component — SEO friendly)
  const [profil, beritaRaw, pengurusRaw, gerai] = await Promise.all([
    prisma.profilOrganisasi.findFirst().catch(() => null),
    prisma.berita.findMany({
      where: { status: "published" },
      orderBy: { tanggalPublikasi: "desc" },
      take: 6,
      select: {
        id: true, judul: true, slug: true, ringkasan: true,
        gambarUrl: true, tanggalPublikasi: true, status: true,
        penulis: { select: { nama: true } },
      },
    }).catch(() => []),
    prisma.pengurus.findMany({
      where: { aktif: true },
      select: {
        id: true, nama: true, jabatan: true, tingkatan: true,
        periode: true, fotoUrl: true, urutan: true,
      },
    }).catch(() => []),
    prisma.informasiGerai.findFirst().catch(() => null),
  ]);

  const beritaList = filterPublishedBerita(beritaRaw) as BeritaPublic[];
  const pengurusList = sortPengurus(pengurusRaw) as PengurusPublic[];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader
        orgName={profil?.nama || "PD BKMT Kabupaten Kubu Raya"}
        singkatan={profil?.singkatan}
        logoUrl={profil?.logoUrl}
      />

      <main id="beranda">
        <HeroSection profil={profil} />
        <VisiMisiSection profil={profil} />
        <BeritaSection beritaList={beritaList} />
        <PengurusSection pengurusList={pengurusList} />
        <GeraiSection gerai={gerai} />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-3">{profil?.singkatan || "PD BKMT"}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {profil?.deskripsi || "Pimpinan Daerah Badan Kontak Majelis Taklim Kabupaten Kubu Raya"}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Navigasi</h4>
              <div className="space-y-2">
                {["#beranda", "#profil", "#berita", "#pengurus", "#gerai"].map((href, i) => (
                  <a key={href} href={href} className="block text-gray-500 hover:text-emerald-400 text-sm transition-colors">
                    {["Beranda", "Profil", "Berita", "Pengurus", "Gerai"][i]}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Kontak</h4>
              <div className="space-y-2 text-sm text-gray-500">
                {profil?.alamat && <p>{profil.alamat}</p>}
                {profil?.telepon && <p>{profil.telepon}</p>}
                {profil?.email && <p>{profil.email}</p>}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-600 text-sm">© {new Date().getFullYear()} PD BKMT Kabupaten Kubu Raya</p>
            <a href="/login" className="text-emerald-500 hover:text-emerald-400 text-sm transition-colors">
              Login Kasir →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
