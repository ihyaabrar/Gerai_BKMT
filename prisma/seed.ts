import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Pengaturan default
  await prisma.pengaturan.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      namaToko: "Gerai BKMT",
      alamatToko: "Jl. Contoh No. 123",
      teleponToko: "081234567890",
      prefixTransaksi: "TRX",
      diskonMember: 5,
      persenNasabah: 30,
      persenPengelola: 70,
    },
  });
  console.log('✅ Pengaturan created');

  // User dengan password ter-hash
  const adminHash = await bcrypt.hash("admin123", 12);
  const kasirHash = await bcrypt.hash("kasir123", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: { password: adminHash },
    create: {
      nama: "Admin Master",
      username: "admin",
      password: adminHash,
      role: "master",
    },
  });

  await prisma.user.upsert({
    where: { username: "kasir" },
    update: { password: kasirHash },
    create: {
      nama: "Kasir 1",
      username: "kasir",
      password: kasirHash,
      role: "kasir",
    },
  });
  console.log('✅ User created (password hashed)');

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
