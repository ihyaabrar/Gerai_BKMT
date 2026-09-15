import { prisma } from "@/lib/prisma";
import { sortPengurus, filterPublishedBerita } from "@/lib/utils";
import { PublicHeader } from "@/components/public/PublicHeader";
import { HeroSection, VisiMisiSection } from "@/components/public/HeroSection";
import { BeritaSection } from "@/components/public/BeritaSection";
import { PengurusSection } from "@/components/public/PengurusSection";
import { GeraiSection } from "@/components/public/GeraiSection";
import { GaleriAgendaSection } from "@/components/public/GaleriAgendaSection";
import { PublicFooter } from "@/components/public/PublicFooter";
import type { PengurusPublic, BeritaPublic } from "@/types/public-profile";

export const dynamic = "force-dynamic";

function awalHariIni(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function PublicProfilePage() {
  // Fetch semua data langsung dari Prisma (Server Component — SEO friendly)
  const [profil, beritaRaw, pengurusRaw, gerai, galeri, agenda] = await Promise.all([
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
        id: true, nama: true, jabatan: true, tingkatan: true, wilayah: true,
        periode: true, fotoUrl: true, urutan: true,
      },
    }).catch(() => []),
    prisma.informasiGerai.findFirst().catch(() => null),
    prisma.galeri
      .findMany({
        where: { aktif: true },
        orderBy: [{ urutan: "asc" }, { createdAt: "desc" }],
        take: 6,
        select: {
          id: true, judul: true, deskripsi: true, gambarUrl: true, kategori: true,
        },
      })
      .catch(() => []),
    // Hanya agenda yang belum lewat dan belum dibatalkan.
    prisma.agendaKegiatan
      .findMany({
        where: {
          tanggal: { gte: awalHariIni() },
          status: { notIn: ["batal", "selesai"] },
        },
        orderBy: { tanggal: "asc" },
        take: 5,
        select: {
          id: true, judul: true, deskripsi: true, tanggal: true,
          waktuMulai: true, waktuSelesai: true, lokasi: true, kategori: true,
        },
      })
      .catch(() => []),
  ]);

  const beritaList = filterPublishedBerita(beritaRaw) as BeritaPublic[];
  const pengurusList = sortPengurus(pengurusRaw) as PengurusPublic[];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <PublicHeader
        orgName={profil?.nama || "PD BKMT Kabupaten Kubu Raya"}
        singkatan={profil?.singkatan}
        logoUrl={profil?.logoUrl}
        slogan={profil?.slogan}
      />

      <main>
        <HeroSection profil={profil} />
        <VisiMisiSection profil={profil} />
        <BeritaSection beritaList={beritaList} />
        <PengurusSection pengurusList={pengurusList} />
        <GaleriAgendaSection galeri={galeri} agenda={agenda} />
        <GeraiSection gerai={gerai} />
      </main>

      <PublicFooter profil={profil} />
    </div>
  );
}
