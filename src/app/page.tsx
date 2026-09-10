import { prisma } from "@/lib/prisma";
import { sortPengurus, filterPublishedBerita } from "@/lib/utils";
import { PublicHeader } from "@/components/public/PublicHeader";
import { HeroSection, VisiMisiSection } from "@/components/public/HeroSection";
import { BeritaSection } from "@/components/public/BeritaSection";
import { PengurusSection } from "@/components/public/PengurusSection";
import { GeraiSection } from "@/components/public/GeraiSection";
import { GaleriAgendaSection } from "@/components/public/GaleriAgendaSection";
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
        id: true, nama: true, jabatan: true, tingkatan: true,
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
      />

      <main>
        <HeroSection profil={profil} />
        <VisiMisiSection profil={profil} />
        <BeritaSection beritaList={beritaList} />
        <PengurusSection pengurusList={pengurusList} />
        <GaleriAgendaSection galeri={galeri} agenda={agenda} />
        <GeraiSection gerai={gerai} />
      </main>

      <footer className="bg-brand-deep text-brand-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-3 font-display">{profil?.singkatan || "PD BKMT"}</h3>
              <p className="text-brand-200/80 text-sm leading-relaxed">
                {profil?.deskripsi || "Pimpinan Daerah Badan Kontak Majelis Taklim Kabupaten Kubu Raya"}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Navigasi</h4>
              <div className="space-y-2">
                {["#beranda", "#profil", "#berita", "#pengurus", "#gerai"].map((href, i) => (
                  <a key={href} href={href} className="block text-brand-200/80 hover:text-white text-sm transition-colors">
                    {["Beranda", "Profil", "Berita", "Pengurus", "Gerai"][i]}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Kontak</h4>
              <div className="space-y-2 text-sm text-brand-200/80">
                {profil?.alamat && <p>{profil.alamat}</p>}
                {profil?.telepon && <p>{profil.telepon}</p>}
                {profil?.email && <p>{profil.email}</p>}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-brand-300/70 text-sm">© {new Date().getFullYear()} PD BKMT Kabupaten Kubu Raya</p>
            <p className="font-script text-lg text-gold-300">
              Bersama Umat, Membangun Masyarakat
            </p>
            <a
              href="/login"
              className="text-gold-300 hover:text-gold-200 text-sm font-medium transition-colors"
            >
              Login Kasir →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
