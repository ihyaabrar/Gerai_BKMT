import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BAWAAN_ADMIN = "admin123";
const BAWAAN_KASIR = "kasir123";

/**
 * Menentukan password akun awal, dan menolak lebih dulu bila password bawaan
 * akan masuk ke database yang bukan milik mesin pengembang.
 *
 * Yang menentukan bahaya di sini adalah DATABASE-nya, bukan NODE_ENV.
 * Database produksi hampir selalu di-seed dari laptop pengurus, di mana
 * NODE_ENV kosong — memeriksa NODE_ENV membuat pengaman ini tidak pernah
 * menyala justru pada satu-satunya skenario yang seharusnya dilindunginya,
 * dan "admin123" masuk ke database sungguhan.
 *
 * Dijalankan sebelum satu baris pun ditulis, supaya seed yang ditolak tidak
 * meninggalkan data setengah jadi.
 */
function tentukanPassword() {
  const admin = process.env.SEED_ADMIN_PASSWORD || BAWAAN_ADMIN;
  const kasir = process.env.SEED_KASIR_PASSWORD || BAWAAN_KASIR;

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const databaseLokal = /@(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)[:/]/.test(
    databaseUrl
  );
  const memakaiBawaan = admin === BAWAAN_ADMIN || kasir === BAWAAN_KASIR;

  if (memakaiBawaan && !databaseLokal) {
    throw new Error(
      "Database ini bukan database lokal, jadi password bawaan tidak boleh dipakai.\n" +
        "Tentukan SEED_ADMIN_PASSWORD dan SEED_KASIR_PASSWORD lebih dulu, misalnya:\n" +
        '  SEED_ADMIN_PASSWORD="..." SEED_KASIR_PASSWORD="..." npm run db:seed'
    );
  }

  if (memakaiBawaan) {
    console.warn(
      "⚠️  Memakai password bawaan (admin123 / kasir123) karena database ini lokal."
    );
  }

  return { admin, kasir };
}

async function main() {
  // Diperiksa paling awal: lebih baik berhenti sebelum menulis apa pun.
  const password = tentukanPassword();

  console.log('🌱 Seeding database...');

  // Pengaturan default
  await prisma.pengaturan.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      namaToko: "Gerai BKMT",
      // Dikosongkan: diisi pengurus di Sistem → Pengaturan, dan tercetak di struk.
      alamatToko: "",
      teleponToko: "",
      prefixTransaksi: "TRX",
      diskonMember: 5,
      persenNasabah: 30,
      persenPengelola: 70,
    },
  });
  console.log('✅ Pengaturan created');

  const adminHash = await bcrypt.hash(password.admin, 12);
  const kasirHash = await bcrypt.hash(password.kasir, 12);

  // `update` sengaja dikosongkan.
  //
  // Sebelumnya baris ini menulis ulang password setiap kali seed dijalankan.
  // Pengurus yang sudah mengganti passwordnya akan diam-diam dikembalikan ke
  // "admin123" pada deploy berikutnya — tanpa ada yang tahu.
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      nama: "Admin Master",
      username: "admin",
      password: adminHash,
      role: "master",
    },
  });

  await prisma.user.upsert({
    where: { username: "kasir" },
    update: {},
    create: {
      nama: "Kasir 1",
      username: "kasir",
      password: kasirHash,
      role: "kasir",
    },
  });
  console.log('✅ User created (password hashed, tidak menimpa yang sudah ada)');

  // Kategori Barang
  const kategoriBarangData = ["Makanan", "Minuman", "Snack", "Sembako", "Alat Tulis", "Lainnya"];
  for (const nama of kategoriBarangData) {
    await prisma.kategoriBarang.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
  }
  console.log('✅ Kategori Barang created');

  // Kategori Pengeluaran
  const kategoriPengeluaranData = [
    "Gaji", "Listrik", "Air", "Sewa", "Transportasi",
    "Pemeliharaan", "Perlengkapan", "Lainnya",
  ];
  for (const nama of kategoriPengeluaranData) {
    await prisma.kategoriPengeluaran.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
  }
  console.log('✅ Kategori Pengeluaran created');

  // Barang contoh
  const barangData = [
    { kode: "BRG001", barcode: "1234567890001", nama: "Kopi Susu", kategori: "Minuman", hargaBeli: 8000, hargaJual: 12000, stok: 50, stokMinimum: 10, satuan: "cup" },
    { kode: "BRG002", barcode: "1234567890002", nama: "Nasi Goreng", kategori: "Makanan", hargaBeli: 12000, hargaJual: 18000, stok: 30, stokMinimum: 5, satuan: "porsi" },
    { kode: "BRG003", barcode: "1234567890003", nama: "Es Teh Manis", kategori: "Minuman", hargaBeli: 3000, hargaJual: 5000, stok: 100, stokMinimum: 20, satuan: "gelas" },
    { kode: "BRG004", barcode: "1234567890004", nama: "Mie Goreng", kategori: "Makanan", hargaBeli: 10000, hargaJual: 15000, stok: 25, stokMinimum: 5, satuan: "porsi" },
    { kode: "BRG005", barcode: "1234567890005", nama: "Jus Jeruk", kategori: "Minuman", hargaBeli: 7000, hargaJual: 10000, stok: 40, stokMinimum: 10, satuan: "gelas" },
  ];
  for (const b of barangData) {
    await prisma.barang.upsert({ where: { kode: b.kode }, update: {}, create: b });
  }
  console.log('✅ Barang created');

  // Member contoh
  const memberData = [
    { kode: "MBR00001", nama: "Budi Santoso", telepon: "081234567891", alamat: "Jl. Merdeka No. 1", poin: 100 },
    { kode: "MBR00002", nama: "Siti Aminah", telepon: "081234567892", alamat: "Jl. Sudirman No. 2", poin: 50 },
    { kode: "MBR00003", nama: "Ahmad Fauzi", telepon: "081234567893", alamat: "Jl. Gatot Subroto No. 3", poin: 75 },
  ];
  for (const m of memberData) {
    await prisma.member.upsert({ where: { kode: m.kode }, update: {}, create: m });
  }
  console.log('✅ Member created');

  // Nasabah contoh — persentase dihitung otomatis
  const nasabahData = [
    { nama: "H. Abdullah", telepon: "081234567894", alamat: "Jl. Masjid No. 10", jumlahInvestasi: 10000000 },
    { nama: "Hj. Fatimah", telepon: "081234567895", alamat: "Jl. Pondok No. 20", jumlahInvestasi: 6000000 },
    { nama: "Ustadz Yusuf", telepon: "081234567896", alamat: "Jl. Pesantren No. 30", jumlahInvestasi: 4000000 },
  ];
  const totalInvestasi = nasabahData.reduce((s, n) => s + n.jumlahInvestasi, 0);
  for (const n of nasabahData) {
    const persentase = (n.jumlahInvestasi / totalInvestasi) * 100;
    const existing = await prisma.nasabah.findFirst({ where: { nama: n.nama } });
    if (!existing) {
      await prisma.nasabah.create({ data: { ...n, persentase } });
    }
  }
  console.log('✅ Nasabah created');

  // Supplier contoh
  const supplierData = [
    { nama: "CV. Sumber Rezeki", telepon: "081234567897", alamat: "Jl. Pasar No. 100" },
    { nama: "PT. Maju Jaya", telepon: "081234567898", alamat: "Jl. Industri No. 200" },
  ];
  for (const s of supplierData) {
    const existing = await prisma.supplier.findFirst({ where: { nama: s.nama } });
    if (!existing) await prisma.supplier.create({ data: s });
  }
  console.log('✅ Supplier created');

  // ─── Public Profile Seed Data ─────────────────────────────────────────────

  // Profil Organisasi
  const existingProfil = await prisma.profilOrganisasi.findFirst();
  if (!existingProfil) {
    await prisma.profilOrganisasi.create({
      data: {
        nama: "Pimpinan Daerah Badan Kontak Majelis Taklim Kabupaten Kubu Raya",
        singkatan: "PD BKMT Kubu Raya",
        deskripsi: "Organisasi kemasyarakatan Islam yang menjadi wadah koordinasi dan pembinaan majelis taklim di Kabupaten Kubu Raya, Kalimantan Barat. Bergerak di bidang pendidikan keagamaan, pemberdayaan ekonomi umat, dan kegiatan sosial kemasyarakatan.",
        visi: "Terwujudnya masyarakat Muslim Kabupaten Kubu Raya yang beriman, berilmu, berakhlak mulia, dan berdaya secara ekonomi melalui pembinaan majelis taklim yang terorganisir.",
        misi: "1. Mengkoordinasikan dan membina majelis taklim di seluruh wilayah Kabupaten Kubu Raya\n2. Meningkatkan kualitas pendidikan keagamaan Islam bagi masyarakat, khususnya kaum perempuan\n3. Memberdayakan ekonomi anggota melalui program usaha produktif dan koperasi\n4. Menjalin silaturahmi dan kerjasama antar majelis taklim, pemerintah, dan organisasi Islam lainnya\n5. Mengembangkan generasi muda Islam melalui program Permata BKMT",
        sejarah: "BKMT (Badan Kontak Majelis Taklim) didirikan secara nasional pada tahun 1981 sebagai organisasi yang mewadahi majelis taklim di seluruh Indonesia. PD BKMT Kabupaten Kubu Raya merupakan pimpinan daerah yang bertugas mengkoordinasikan seluruh kegiatan BKMT di wilayah Kabupaten Kubu Raya, Kalimantan Barat. Kabupaten Kubu Raya terbentuk pada 17 Juli 2007, dengan ibu kota di Sungai Raya, berbatasan langsung dengan Kota Pontianak. PD BKMT Kubu Raya membawahi 20 Pimpinan Cabang (PC) di tingkat kecamatan dan kelurahan, serta sekitar 130 kelompok Permata BKMT yang merupakan organisasi remaja dan pemuda.",
        alamat: "Kabupaten Kubu Raya, Kalimantan Barat",
        telepon: "",
        email: "",
      },
    });
    console.log('✅ ProfilOrganisasi created');
  }

  // Informasi Gerai
  const existingGerai = await prisma.informasiGerai.findFirst();
  if (!existingGerai) {
    await prisma.informasiGerai.create({
      data: {
        nama: "Gerai BKMT Kubu Raya",
        alamat: "Kabupaten Kubu Raya, Kalimantan Barat",
        jamOperasional: "Senin - Sabtu, 08.00 - 17.00 WIB",
        telepon: "",
        deskripsi: "Unit usaha ekonomi produktif PD BKMT Kabupaten Kubu Raya yang menyediakan kebutuhan sehari-hari anggota dan masyarakat sekitar. Gerai ini merupakan wujud nyata program pemberdayaan ekonomi umat yang dikelola secara profesional dengan sistem kasir digital.",
      },
    });
    console.log('✅ InformasiGerai created');
  }

  // Pengurus contoh (PD BKMT)
  const existingPengurus = await prisma.pengurus.findFirst();
  if (!existingPengurus) {
    await prisma.pengurus.createMany({
      data: [
        { nama: "Ketua PD BKMT", jabatan: "Ketua", tingkatan: "PD", periode: "2023-2027", urutan: 1 },
        { nama: "Wakil Ketua", jabatan: "Wakil Ketua", tingkatan: "PD", periode: "2023-2027", urutan: 2 },
        { nama: "Sekretaris", jabatan: "Sekretaris", tingkatan: "PD", periode: "2023-2027", urutan: 3 },
        { nama: "Bendahara", jabatan: "Bendahara", tingkatan: "PD", periode: "2023-2027", urutan: 4 },
      ],
    });
    console.log('✅ Pengurus contoh created');
  }

  // Berita contoh
  const existingBerita = await prisma.berita.findFirst();
  if (!existingBerita) {
    const adminUser = await prisma.user.findFirst({ where: { role: "master" } });
    await prisma.berita.create({
      data: {
        judul: "Selamat Datang di Website Resmi PD BKMT Kabupaten Kubu Raya",
        slug: "selamat-datang-website-resmi-pd-bkmt-kubu-raya",
        konten: "Alhamdulillah, website resmi Pimpinan Daerah Badan Kontak Majelis Taklim (PD BKMT) Kabupaten Kubu Raya telah resmi diluncurkan.\n\nMelalui website ini, kami berharap dapat memberikan informasi yang lebih mudah diakses oleh seluruh anggota, pengurus, dan masyarakat umum mengenai kegiatan dan program PD BKMT Kabupaten Kubu Raya.\n\nWebsite ini juga terintegrasi dengan sistem kasir digital Gerai BKMT yang memudahkan pengelolaan usaha ekonomi produktif organisasi.\n\nSemoga kehadiran website ini dapat memperkuat silaturahmi dan koordinasi antar majelis taklim di seluruh Kabupaten Kubu Raya.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.",
        ringkasan: "Website resmi PD BKMT Kabupaten Kubu Raya telah resmi diluncurkan untuk memudahkan akses informasi bagi seluruh anggota dan masyarakat.",
        status: "published",
        tanggalPublikasi: new Date(),
        penulisId: adminUser?.id || null,
      },
    });
    console.log('✅ Berita contoh created');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
