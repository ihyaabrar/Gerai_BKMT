/**
 * Uji integrasi distribusi bagi hasil.
 *
 * Pertanyaan yang dijawab berkas ini: kalau harga beli barang dinaikkan dan
 * daftar nasabah berubah setelah sebuah periode ditutup, apakah angka bagi
 * hasil periode itu ikut berubah? Jawabannya harus TIDAK — kalau tidak,
 * organisasi kehilangan kemampuan menjelaskan pembagian bulan lalu.
 *
 * Skrip ini MENULIS ke database dan hanya boleh dijalankan terhadap database
 * uji, bukan produksi. Jalankan server lebih dulu (npm run build && npm start),
 * lalu: node scripts/uji-distribusi.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "http://localhost:3000";

let cookie = "";
const api = async (path, init = {}) => {
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

const cek = (nama, syarat, info = "") => {
  console.log(`${syarat ? "  OK  " : " GAGAL"}  ${nama}${info ? "  — " + info : ""}`);
  if (!syarat) process.exitCode = 1;
};

// Periode uji: bulan lalu (sudah berakhir, jadi boleh ditutup).
const skrg = new Date();
const lalu = new Date(skrg.getFullYear(), skrg.getMonth() - 1, 15);
const PERIODE = `${lalu.getFullYear()}-${String(lalu.getMonth() + 1).padStart(2, "0")}`;

async function main() {
  console.log(`\nPeriode uji: ${PERIODE}\n`);

  // Bersihkan sisa uji sebelumnya.
  await prisma.distribusiLaba.deleteMany({ where: { periode: PERIODE } });
  await prisma.distribusiLabaArsip.deleteMany({ where: { periode: PERIODE } });
  await prisma.detailPenjualan.deleteMany({
    where: { penjualan: { nomorTransaksi: { startsWith: "UJI" } } },
  });
  await prisma.penjualan.deleteMany({ where: { nomorTransaksi: { startsWith: "UJI" } } });
  await prisma.nasabah.deleteMany({ where: { nama: { startsWith: "Uji " } } });

  // Nasabah dengan modal 5jt / 3jt / 2jt.
  await prisma.nasabah.updateMany({ data: { aktif: false } });
  const nasabah = [];
  for (const [nama, modal] of [["Uji Aminah", 5_000_000], ["Uji Khadijah", 3_000_000], ["Uji Fatimah", 2_000_000]]) {
    nasabah.push(await prisma.nasabah.create({
      data: { nama, jumlahInvestasi: modal, persentase: 0, aktif: true },
    }));
  }
  const totalModal = 10_000_000;
  for (const n of nasabah) {
    await prisma.nasabah.update({
      where: { id: n.id },
      data: { persentase: (n.jumlahInvestasi / totalModal) * 100 },
    });
  }

  const barang = await prisma.barang.upsert({
    where: { kode: "UJI-001" },
    update: { hargaBeli: 6_000, hargaJual: 10_000, stok: 1000 },
    create: { kode: "UJI-001", nama: "Barang Uji", hargaBeli: 6_000, hargaJual: 10_000, stok: 1000 },
  });

  // Satu penjualan di dalam periode: 100 unit, diskon member 5%.
  // subtotal 1.000.000, diskon 50.000, total 950.000, HPP 600.000
  // → laba kotor 350.000. Bagian nasabah 30% = 105.000.
  const tengahBulan = new Date(Date.UTC(lalu.getFullYear(), lalu.getMonth(), 15, 5, 0, 0));
  await prisma.penjualan.create({
    data: {
      nomorTransaksi: "UJI-0001",
      tanggal: tengahBulan,
      subtotal: 1_000_000,
      diskon: 50_000,
      total: 950_000,
      bayar: 950_000,
      kembalian: 0,
      metodeBayar: "Tunai",
      detail: {
        create: [{ barangId: barang.id, qty: 100, hargaJual: 10_000, hargaBeli: 6_000, subtotal: 1_000_000 }],
      },
    },
  });

  // Login master.
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  cek("login master", login.status === 200, `status ${login.status}`);

  // Pratinjau.
  const pra = await api(`/api/distribusi?periode=${PERIODE}`);
  cek("pratinjau berhasil dimuat", pra.status === 200, `status ${pra.status}`);
  const p = pra.json?.distribusi;
  cek("status pratinjau", pra.json?.status === "pratinjau");
  cek("periode lalu boleh ditutup", pra.json?.bisaDitutup === true);
  cek("laba kotor = 350.000 (diskon ikut terpotong)", p?.labaKotor === 350_000, `dapat ${p?.labaKotor}`);
  cek("diskon tercatat 50.000", p?.totalDiskon === 50_000, `dapat ${p?.totalDiskon}`);
  cek("bagian nasabah = 105.000", p?.bagianNasabah === 105_000, `dapat ${p?.bagianNasabah}`);
  cek("bagian pengelola = 245.000", p?.bagianPengelola === 245_000, `dapat ${p?.bagianPengelola}`);
  cek("bagian nasabah + pengelola = laba", p?.bagianNasabah + p?.bagianPengelola === p?.labaKotor);
  const jumlahBagian = (p?.detail ?? []).reduce((s, d) => s + d.bagian, 0);
  cek("jumlah bagi hasil = bagian nasabah", jumlahBagian === 105_000, `dapat ${jumlahBagian}`);
  const perNama = Object.fromEntries((p?.detail ?? []).map((d) => [d.namaNasabah, d.bagian]));
  cek("pro-rata 5:3:2 per nasabah",
    perNama["Uji Aminah"] === 52_500 && perNama["Uji Khadijah"] === 31_500 && perNama["Uji Fatimah"] === 21_000,
    JSON.stringify(perNama));

  // Tutup periode.
  const tutup = await api("/api/distribusi", { method: "POST", body: JSON.stringify({ periode: PERIODE }) });
  cek("periode berhasil ditutup", tutup.status === 200, tutup.teks.slice(0, 120));

  const tutupLagi = await api("/api/distribusi", { method: "POST", body: JSON.stringify({ periode: PERIODE }) });
  cek("tidak bisa ditutup dua kali", tutupLagi.status === 400, `status ${tutupLagi.status}`);

  const bulanIni = `${skrg.getFullYear()}-${String(skrg.getMonth() + 1).padStart(2, "0")}`;
  const tutupBerjalan = await api("/api/distribusi", { method: "POST", body: JSON.stringify({ periode: bulanIni }) });
  cek("bulan berjalan ditolak", tutupBerjalan.status === 400, tutupBerjalan.json?.error ?? "");

  // ── Inilah ujinya: ubah dunia, lalu baca ulang rekaman. ──
  await prisma.barang.update({ where: { id: barang.id }, data: { hargaBeli: 9_000 } });
  await prisma.nasabah.update({ where: { id: nasabah[2].id }, data: { aktif: false } });
  await prisma.nasabah.create({
    data: { nama: "Uji Maryam", jumlahInvestasi: 20_000_000, persentase: 0, aktif: true },
  });

  const sesudah = await api(`/api/distribusi?periode=${PERIODE}`);
  const s = sesudah.json?.distribusi;
  cek("periode terbaca sebagai ditutup", sesudah.json?.status === "ditutup");
  cek("laba kotor TIDAK berubah setelah harga beli naik", s?.labaKotor === 350_000, `dapat ${s?.labaKotor}`);
  cek("bagian nasabah TIDAK berubah", s?.bagianNasabah === 105_000, `dapat ${s?.bagianNasabah}`);
  cek("jumlah nasabah tetap 3 walau roster berubah", s?.detail?.length === 3, `dapat ${s?.detail?.length}`);
  cek("nama nasabah ikut dibekukan",
    JSON.stringify(s?.detail.map((d) => d.namaNasabah).sort()) ===
      JSON.stringify(["Uji Aminah", "Uji Fatimah", "Uji Khadijah"]),
    JSON.stringify(s?.detail?.map((d) => d.namaNasabah)));
  cek("nasabah baru tidak ikut periode lama",
    !(s?.detail ?? []).some((d) => d.namaNasabah === "Uji Maryam"));
  cek("dicatat siapa yang menutup", Boolean(s?.dibuatOleh?.nama), s?.dibuatOleh?.nama ?? "kosong");

  // Kasir tidak boleh mengakses sama sekali.
  cookie = "";
  const loginKasir = await api("/api/auth/login", {
    method: "POST", body: JSON.stringify({ username: "kasir", password: "kasir123" }),
  });
  if (loginKasir.status === 200) {
    const akses = await api(`/api/distribusi?periode=${PERIODE}`);
    cek("kasir ditolak dari /api/distribusi", akses.status === 401 || akses.status === 403, `status ${akses.status}`);
  } else {
    console.log("  (akun kasir tidak ada di seed — lewati uji akses)");
  }

  console.log();
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
