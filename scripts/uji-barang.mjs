/**
 * Uji integrasi pengelolaan barang.
 *
 *  1. Harga jual yang diubah lewat Edit Barang langsung dipakai kasir, dan
 *     laba penjualan yang sudah terjadi tidak ikut berubah.
 *  2. Stok tidak bisa diubah lewat Edit Barang (harus lewat Barang Masuk atau
 *     Penyesuaian supaya tercatat).
 *  3. Kode dan barcode kembar ditolak dengan pesan yang jelas.
 *  4. Kasir tidak bisa mengubah barang.
 *  5. Barang masuk dengan harga berbeda menghasilkan harga beli rata-rata.
 *  6. Barang rusak/hilang (penyesuaian keluar) mengurangi laba yang dibagi,
 *     dan nilainya ikut tersimpan saat distribusi ditutup.
 *
 * Skrip ini MENULIS ke database dan hanya boleh dijalankan terhadap database
 * uji, bukan produksi. Jalankan server lebih dulu (npm run build && npm start),
 * lalu: node scripts/uji-barang.mjs
 */
import { PrismaClient } from "@prisma/client";
import { pastikanDatabaseLokal } from "./_hanya-lokal.mjs";

pastikanDatabaseLokal();
const prisma = new PrismaClient();
const BASE = "http://localhost:3000";

const sesi = () => {
  let cookie = "";
  return async (path, init = {}) => {
    const res = await fetch(BASE + path, {
      ...init,
      headers: { "Content-Type": "application/json", cookie, ...(init.headers || {}) },
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    const teks = await res.text();
    let json = null;
    try { json = JSON.parse(teks); } catch {}
    return { status: res.status, json, teks };
  };
};

const cek = (nama, syarat, info = "") => {
  console.log(`${syarat ? "  OK  " : " GAGAL"}  ${nama}${info ? "  — " + info : ""}`);
  if (!syarat) process.exitCode = 1;
};

const kunci = () => `uji-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

async function siapkanBarang(kode, data) {
  return prisma.barang.upsert({
    where: { kode },
    update: { ...data, aktif: true },
    create: { kode, ...data, aktif: true },
  });
}

async function main() {
  console.log();
  const admin = sesi();
  const kasir = sesi();

  cek("login admin", (await admin("/api/auth/login", {
    method: "POST", body: JSON.stringify({ username: "admin", password: "admin123" }),
  })).status === 200);
  cek("login kasir", (await kasir("/api/auth/login", {
    method: "POST", body: JSON.stringify({ username: "kasir", password: "kasir123" }),
  })).status === 200);

  const a = await siapkanBarang("UJI-EDIT-A", {
    nama: "Barang Uji Edit A", barcode: "UJIEDIT0001", hargaBeli: 4_000, hargaJual: 10_000, stok: 50,
  });
  const b = await siapkanBarang("UJI-EDIT-B", {
    nama: "Barang Uji Edit B", barcode: "UJIEDIT0002", hargaBeli: 1_000, hargaJual: 2_000, stok: 5,
  });

  const jual = (api) =>
    api("/api/penjualan", {
      method: "POST",
      body: JSON.stringify({
        items: [{ id: a.id, qty: 1 }], bayar: 100_000, metodeBayar: "Tunai", idempotencyKey: kunci(),
      }),
    });

  // ── 1. Ubah harga jual ──
  console.log("[Ubah harga jual]");
  const sebelum = await jual(kasir);
  cek("penjualan dengan harga lama", sebelum.status === 200 && sebelum.json?.total === 10_000,
    `total ${sebelum.json?.total}`);

  const ubah = await admin("/api/barang", {
    method: "PATCH",
    body: JSON.stringify({ id: a.id, nama: "Barang Uji Edit A (baru)", hargaJual: 12_000, stokMinimum: 7 }),
  });
  cek("admin mengubah nama, harga jual, stok minimum", ubah.status === 200, ubah.teks.slice(0, 100));

  const sesudah = await jual(kasir);
  cek("kasir langsung memakai harga baru", sesudah.json?.total === 12_000, `total ${sesudah.json?.total}`);

  const detailLama = await prisma.detailPenjualan.findFirst({
    where: { penjualanId: sebelum.json?.id },
  });
  cek("penjualan lama tetap tercatat dengan harga lama", detailLama?.hargaJual === 10_000,
    `harga ${detailLama?.hargaJual}`);

  // ── 2. Stok tidak lewat sini ──
  console.log("[Stok]");
  const stokSebelum = (await prisma.barang.findUnique({ where: { id: a.id } })).stok;
  const ubahStok = await admin("/api/barang", {
    method: "PATCH", body: JSON.stringify({ id: a.id, stok: 999 }),
  });
  cek("mengubah stok lewat edit ditolak (400)", ubahStok.status === 400, ubahStok.json?.error ?? "");
  const stokSesudah = (await prisma.barang.findUnique({ where: { id: a.id } })).stok;
  cek("stok tidak berubah", stokSesudah === stokSebelum, `${stokSebelum} → ${stokSesudah}`);

  // ── 3. Kode & barcode kembar ──
  console.log("[Kode kembar]");
  const kodeKembar = await admin("/api/barang", {
    method: "PATCH", body: JSON.stringify({ id: b.id, kode: "UJI-EDIT-A" }),
  });
  cek("kode yang sudah dipakai ditolak (400, bukan 500)", kodeKembar.status === 400,
    kodeKembar.json?.error ?? `status ${kodeKembar.status}`);

  const barcodeKembar = await admin("/api/barang", {
    method: "PATCH", body: JSON.stringify({ id: b.id, barcode: "UJIEDIT0001" }),
  });
  cek("barcode yang sudah dipakai ditolak (400)", barcodeKembar.status === 400,
    barcodeKembar.json?.error ?? `status ${barcodeKembar.status}`);

  const kodeSendiri = await admin("/api/barang", {
    method: "PATCH", body: JSON.stringify({ id: b.id, kode: "UJI-EDIT-B", barcode: "UJIEDIT0002" }),
  });
  cek("menyimpan ulang kode & barcode miliknya sendiri tetap boleh", kodeSendiri.status === 200,
    kodeSendiri.teks.slice(0, 100));

  const hargaTerbalik = await admin("/api/barang", {
    method: "PATCH", body: JSON.stringify({ id: b.id, hargaJual: 500 }),
  });
  cek("harga jual di bawah harga beli ditolak", hargaTerbalik.status === 400);

  // ── 4. Kasir ──
  console.log("[Kasir]");
  const kasirUbah = await kasir("/api/barang", {
    method: "PATCH", body: JSON.stringify({ id: a.id, hargaJual: 1 }),
  });
  cek("kasir tidak bisa mengubah barang (403)", kasirUbah.status === 403, `status ${kasirUbah.status}`);

  // ── 5. Harga beli rata-rata ──
  console.log("[Harga beli rata-rata]");
  const c = await siapkanBarang("UJI-RATA", {
    nama: "Barang Uji Rata-rata", barcode: null, hargaBeli: 4_000, hargaJual: 10_000, stok: 10,
  });
  const masuk = (api, body) =>
    api("/api/barang-masuk", { method: "POST", body: JSON.stringify({ mode: "existing", barangId: c.id, ...body }) });

  const m1 = await masuk(admin, { qty: 10, updateHargaBeli: true, hargaBeliBaru: 5_000 });
  cek("admin mencatat 10 pcs @ Rp5.000", m1.status === 200, m1.teks.slice(0, 120));
  const c1 = await prisma.barang.findUnique({ where: { id: c.id } });
  cek("harga beli menjadi rata-rata Rp4.500 (bukan ditimpa Rp5.000)", c1.hargaBeli === 4_500,
    `harga ${c1.hargaBeli}`);
  cek("stok 20", c1.stok === 20, `stok ${c1.stok}`);
  cek("pengeluaran dicatat dengan harga pembelian sebenarnya (Rp50.000)",
    m1.json?.totalPengeluaran === 50_000, `${m1.json?.totalPengeluaran}`);

  const m2 = await masuk(kasir, { qty: 5, updateHargaBeli: true, hargaBeliBaru: 1 });
  cek("kasir tidak bisa menentukan harga pembelian (400)", m2.status === 400, `status ${m2.status}`);
  const m3 = await masuk(kasir, { qty: 5 });
  const c3 = await prisma.barang.findUnique({ where: { id: c.id } });
  cek("kasir menambah stok tanpa mengubah harga rata-rata", m3.status === 200 && c3.hargaBeli === 4_500,
    `status ${m3.status}, harga ${c3.hargaBeli}`);

  const m4 = await masuk(admin, { qty: 25, updateHargaBeli: true, hargaBeliBaru: 30_000 });
  cek("rata-rata di atas harga jual ditolak dengan pesan jelas", m4.status === 400 &&
    (m4.json?.error ?? "").includes("rata-rata"), m4.json?.error ?? `status ${m4.status}`);

  // ── 6. Kerugian stok ──
  console.log("[Kerugian stok bulan ini]");
  // Hanya database uji: penyesuaian bulan ini dibersihkan supaya angkanya pasti.
  const skrg = new Date(Date.now() + 7 * 3600_000);
  const awalBulanIni = new Date(Date.UTC(skrg.getUTCFullYear(), skrg.getUTCMonth(), 1) - 7 * 3600_000);
  await prisma.penyesuaianStok.deleteMany({ where: { tanggal: { gte: awalBulanIni } } });

  const distribusiIni = async () => (await admin("/api/distribusi")).json?.distribusi;
  const sebelumRusak = await distribusiIni();
  cek("tanpa penyesuaian, kerugian stok 0", sebelumRusak?.kerugianStok === 0,
    `${sebelumRusak?.kerugianStok}`);

  const rusak = await kasir("/api/penyesuaian", {
    method: "POST", body: JSON.stringify({ barangId: c.id, jenis: "keluar", qty: 3, alasan: "Uji: kemasan rusak" }),
  });
  cek("kasir mencatat 3 pcs rusak", rusak.status === 200, rusak.teks.slice(0, 100));
  cek("harga beli dibekukan di catatan penyesuaian", rusak.json?.hargaBeli === 4_500,
    `${rusak.json?.hargaBeli}`);

  const setelahRusak = await distribusiIni();
  cek("kerugian stok = 3 x Rp4.500 = Rp13.500", setelahRusak?.kerugianStok === 13_500,
    `${setelahRusak?.kerugianStok}`);
  cek("laba dibagi = laba kotor - kerugian",
    setelahRusak?.labaDibagi === setelahRusak?.labaKotor - 13_500,
    `${setelahRusak?.labaDibagi} vs ${setelahRusak?.labaKotor}`);
  cek("bagian nasabah + pengelola = laba dibagi",
    setelahRusak?.labaDibagi <= 0 ||
      setelahRusak?.bagianNasabah + setelahRusak?.bagianPengelola === Math.round(setelahRusak?.labaDibagi));

  const laporan = await admin("/api/laporan?type=penjualan");
  cek("laporan menunjukkan kerugian yang sama", laporan.json?.kerugianStok === 13_500,
    `${laporan.json?.kerugianStok}`);

  await kasir("/api/penyesuaian", {
    method: "POST", body: JSON.stringify({ barangId: c.id, jenis: "masuk", qty: 1, alasan: "Uji: satu ternyata utuh" }),
  });
  cek("penyesuaian masuk mengoreksi kerugian (Rp9.000)", (await distribusiIni())?.kerugianStok === 9_000);

  await kasir("/api/penyesuaian", {
    method: "POST", body: JSON.stringify({ barangId: c.id, jenis: "masuk", qty: 10, alasan: "Uji: tambah lewat penyesuaian" }),
  });
  cek("penyesuaian masuk tidak pernah membuat kerugian negatif", (await distribusiIni())?.kerugianStok === 0);
  await prisma.penyesuaianStok.deleteMany({ where: { tanggal: { gte: awalBulanIni } } });

  // ── 7. Kerugian ikut tersimpan saat distribusi ditutup ──
  console.log("[Distribusi ditutup dengan kerugian stok]");
  const PERIODE_UJI = "2025-01";
  const TENGAH = new Date(Date.UTC(2025, 0, 15, 5));
  const bersihkanPeriode = async () => {
    await prisma.distribusiLaba.deleteMany({ where: { periode: PERIODE_UJI } });
    await prisma.distribusiLabaArsip.deleteMany({ where: { periode: PERIODE_UJI } });
    await prisma.penyesuaianStok.deleteMany({ where: { tanggal: { gte: new Date(Date.UTC(2024, 11, 31, 17)), lt: new Date(Date.UTC(2025, 0, 31, 17)) } } });
    await prisma.detailPenjualan.deleteMany({ where: { penjualan: { nomorTransaksi: { startsWith: "UJIRUSAK" } } } });
    await prisma.penjualan.deleteMany({ where: { nomorTransaksi: { startsWith: "UJIRUSAK" } } });
  };
  await bersihkanPeriode();
  const adaPenjualanLain = await prisma.penjualan.count({
    where: { tanggal: { gte: new Date(Date.UTC(2024, 11, 31, 17)), lt: new Date(Date.UTC(2025, 0, 31, 17)) } },
  });
  cek("periode uji 2025-01 kosong", adaPenjualanLain === 0, `${adaPenjualanLain} penjualan`);

  // Laba kotor 100.000 (penjualan 200.000, HPP 100.000), barang rusak 20.000.
  await prisma.penjualan.create({
    data: {
      nomorTransaksi: `UJIRUSAK${Date.now()}`, tanggal: TENGAH, subtotal: 200_000, total: 200_000,
      bayar: 200_000, kembalian: 0, metodeBayar: "Tunai", status: "selesai",
      detail: { create: [{ barangId: c.id, qty: 20, hargaBeli: 5_000, hargaJual: 10_000, subtotal: 200_000 }] },
    },
  });
  await prisma.penyesuaianStok.create({
    data: { barangId: c.id, jenis: "keluar", qty: 4, hargaBeli: 5_000, alasan: "Uji: kedaluwarsa", tanggal: TENGAH },
  });

  const tutup = await admin("/api/distribusi", { method: "POST", body: JSON.stringify({ periode: PERIODE_UJI }) });
  const rekaman = tutup.json?.distribusi;
  cek("distribusi 2025-01 ditutup", tutup.status === 200, tutup.teks.slice(0, 120));
  cek("rekaman menyimpan laba kotor 100.000 dan kerugian 20.000",
    rekaman?.labaKotor === 100_000 && rekaman?.kerugianStok === 20_000,
    `laba ${rekaman?.labaKotor}, kerugian ${rekaman?.kerugianStok}`);
  cek("bagian nasabah dihitung dari 80.000",
    rekaman?.bagianNasabah === Math.round((80_000 * rekaman?.persenNasabah) / 100) &&
      rekaman?.bagianNasabah + rekaman?.bagianPengelola === 80_000,
    `nasabah ${rekaman?.bagianNasabah}, pengelola ${rekaman?.bagianPengelola}`);

  // Penyesuaian yang dicatat belakangan tidak mengubah rekaman yang sudah ditutup.
  await prisma.penyesuaianStok.create({
    data: { barangId: c.id, jenis: "keluar", qty: 10, hargaBeli: 5_000, alasan: "Uji: dicatat telat", tanggal: TENGAH },
  });
  const dibaca = (await admin(`/api/distribusi?periode=${PERIODE_UJI}`)).json?.distribusi;
  cek("rekaman yang sudah ditutup tidak berubah", dibaca?.kerugianStok === 20_000, `${dibaca?.kerugianStok}`);

  await bersihkanPeriode();
  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
