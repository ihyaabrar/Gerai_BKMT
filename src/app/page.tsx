import { prisma } from "@/lib/prisma";
import { sortPengurus, filterPublishedBerita } from "@/lib/utils";
import { PublicHeader } from "@/components/public/PublicHeader";
import { HeroSection } from "@/components/public/HeroSection";
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
    <div className="min-h-screen">
      <PublicHeader
        orgName={profil?.nama || "PD BKMT Kabupaten Kubu Raya"}
        singkatan={profil?.singkatan}
        logoUrl={profil?.logoUrl}
      />

      <main id="beranda">
        <HeroSection profil={profil} />
        <BeritaSection beritaList={beritaList} />
        <PengurusSection pengurusList={pengurusList} />
        <GeraiSection gerai={gerai} />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <p className="font-semibold text-white mb-1">
          {profil?.singkatan || "PD BKMT"} Kabupaten Kubu Raya
        </p>
        <p>{profil?.alamat || "Kabupaten Kubu Raya, Kalimantan Barat"}</p>
        {profil?.telepon && <p className="mt-1">{profil.telepon}</p>}
        <p className="mt-4 text-gray-600">© {new Date().getFullYear()} PD BKMT Kabupaten Kubu Raya</p>
      </footer>
    </div>
  );
}
