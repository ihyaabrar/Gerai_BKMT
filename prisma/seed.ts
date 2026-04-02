import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Buat pengaturan default
  const pengaturan = await prisma.pengaturan.upsert({
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

  // Buat user default
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      nama: "Admin Master",
      username: "admin",
      password: "admin123",
      role: "master",
    },
  });

  await prisma.user.upsert({
    where: { username: "kasir" },
    update: {},
    create: {
      nama: "Kasir 1",
      username: "kasir",
      password: "kasir123",
      role: "kasir",
    },
  });
  console.log('✅ User created');

  // Buat barang contoh
  const barang = await prisma.barang.createMany({
    data: [
      {
        kode: "BRG001",
        barcode: "1234567890001",
        nama: "Kopi Susu",
        kategori: "Minuman",
        hargaBeli: 8000,
        hargaJual: 12000,
        stok: 50,
        stokMinimum: 10,
        satuan: "cup",
      },
      {
        kode: "BRG002",
        barcode: "1234567890002",
        nama: "Nasi Goreng",
        kategori: "Makanan",
        hargaBeli: 12000,
        hargaJual: 18000,
        stok: 30,
        stokMinimum: 5,
        satuan: "porsi",
      },
      {
        kode: "BRG003",
        barcode: "1234567890003",
        nama: "Es Teh Manis",
        kategori: "Minuman",
        hargaBeli: 3000,
        hargaJual: 5000,
        stok: 100,
        stokMinimum: 20,
        satuan: "gelas",
      },
      {
        kode: "BRG004",
        barcode: "1234567890004",
        nama: "Mie Goreng",
        kategori: "Makanan",
        hargaBeli: 10000,
        hargaJual: 15000,
        stok: 25,
        stokMinimum: 5,
        satuan: "porsi",
      },
      {
        kode: "BRG005",
        barcode: "1234567890005",
        nama: "Jus Jeruk",
        kategori: "Minuman",
        hargaBeli: 7000,
        hargaJual: 10000,
        stok: 40,
        stokMinimum: 10,
        satuan: "gelas",
      },
    ],
  });
  console.log('✅ Barang created');

  // Buat member contoh
  const members = await prisma.member.createMany({
    data: [
      {
        kode: "MBR00001",
        nama: "Budi Santoso",
        telepon: "081234567891",
        alamat: "Jl. Merdeka No. 1",
        poin: 100,
      },
      {
        kode: "MBR00002",
        nama: "Siti Aminah",
        telepon: "081234567892",
        alamat: "Jl. Sudirman No. 2",
        poin: 50,
      },
      {
        kode: "MBR00003",
        nama: "Ahmad Fauzi",
        telepon: "081234567893",
        alamat: "Jl. Gatot Subroto No. 3",
        poin: 75,
      },
    ],
  });
  console.log('✅ Member created');

  // Buat nasabah contoh
  const nasabah = await prisma.nasabah.createMany({
    data: [
      {
        nama: "H. Abdullah",
        telepon: "081234567894",
        alamat: "Jl. Masjid No. 10",
        jumlahInvestasi: 10000000,
        persentase: 50,
      },
      {
        nama: "Hj. Fatimah",
        telepon: "081234567895",
        alamat: "Jl. Pondok No. 20",
        jumlahInvestasi: 6000000,
        persentase: 30,
      },
      {
        nama: "Ustadz Yusuf",
        telepon: "081234567896",
        alamat: "Jl. Pesantren No. 30",
        jumlahInvestasi: 4000000,
        persentase: 20,
      },
    ],
  });
  console.log('✅ Nasabah created');

  // Buat supplier contoh
  const supplier = await prisma.supplier.createMany({
    data: [
      {
        nama: "CV. Sumber Rezeki",
        telepon: "081234567897",
        alamat: "Jl. Pasar No. 100",
      },
      {
        nama: "PT. Maju Jaya",
        telepon: "081234567898",
        alamat: "Jl. Industri No. 200",
      },
    ],
  });
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
