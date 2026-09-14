/**
 * Uji integrasi pembatalan penjualan.
 *
 * Pertanyaan yang dijawab berkas ini:
 * - Apakah stok dan poin member benar-benar kembali setelah pembatalan?
 * - Apakah penjualan yang dibatalkan hilang dari laporan, laba, rekap kas
 *   shift, dan distribusi bagi hasil — di SEMUA tempat, bukan sebagian?
 * - Apakah transaksi pada periode yang distribusinya sudah ditutup ditolak?
 * - Apakah kasir tidak bisa membatalkan?
 *
 * Skrip ini MENULIS ke database dan hanya boleh dijalankan terhadap database
 * uji, bukan produksi. Jalankan server lebih dulu (npm run build && npm start),
 * lalu: node scripts/uji-pembatalan.mjs
 */
import { PrismaClient } from "@prisma/client";
import { pastikanDatabaseLokal } from "./_hanya-lokal.mjs";

pastikanDatabaseLokal();
const prisma = new PrismaClient();
const BASE = "http://localhost:3000";

const sesi = { admin: "", kasir: "" };
let aktif = "admin";

const api = async (path, init = {}) => {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      cookie: sesi[aktif],
      ...(init.headers || {}),
    },
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) sesi[aktif] = setCookie.split(";")[0];
  const teks = await res.text();
  let json = null;
  try {
    json = JSON.parse(teks);
  } catch {}
  return { status: res.status, json, teks };
};

const cek = (nama, syarat, info = "") => {
  console.log(`${syarat ? "  OK  " : " GAGAL"}  ${nama}${info ? "  — " + info : ""}`);
  if (!syarat) process.exitCode = 1;
};

const login = async (peran, username, password) => {
  aktif = peran;
  sesi[peran] = "";
  const res = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return res.status === 200;
};

const skrg = new Date();
const PERIODE_INI = `${skrg.getFullYear()}-${String(skrg.getMonth() + 1).padStart(2, "0")}`;

async function main() {
  console.log();

  // ── Persiapan ──
  await prisma.detailPenjualan.deleteMany({
    where: { penjualan: { nomorTransaksi: { startsWith: "BATAL" } } },
  });
  await prisma.penjualan.deleteMany({ where: { nomorTransaksi: { startsWith: "BATAL" } } });
  await prisma.distribusiLaba.deleteMany({ where: { periode: PERIODE_INI } });

  const barang = await prisma.barang.upsert({
    where: { kode: "UJI-BATAL" },
    update: { hargaBeli: 4_000, hargaJual: 10_000, stok: 100, aktif: true },
    create: {
      kode: "UJI-BATAL",
      nama: "Barang Uji Pembatalan",
      hargaBeli: 4_000,
      hargaJual: 10_000,
      stok: 100,
      aktif: true,
    },
  });

  const member = await prisma.member.upsert({
    where: { kode: "M-UJI-BATAL" },
    update: { poin: 0, aktif: true },
    create: { kode: "M-UJI-BATAL", nama: "Member Uji Batal", poin: 0, aktif: true },
  });

  cek("login admin", await login("admin", "admin", "admin123"));
  cek("login kasir", await login("kasir", "kasir", "kasir123"));
  aktif = "admin";

  // Shift dibuka supaya jalur rekap kas ikut teruji: penjualan yang
  // dibatalkan tidak boleh lagi terhitung sebagai uang di laci.
  await prisma.shiftKasir.updateMany({
    where: { jamTutup: null },
    data: { jamTutup: new Date(), status: "tutup", saldoAkhir: 0 },
  });
  const bukaShift = await api("/api/shift", {
    method: "POST",
    body: JSON.stringify({ action: "buka", saldoAwal: 200_000 }),
  });
  cek("shift dibuka", bukaShift.status === 200, bukaShift.teks.slice(0, 80));

  // ── Transaksi yang akan dibatalkan ──
  const jual = await api("/api/penjualan", {
    method: "POST",
    body: JSON.stringify({
      items: [{ id: barang.id, qty: 10 }],
      memberId: member.id,
      bayar: 1_000_000,
      metodeBayar: "Tunai",
      idempotencyKey: `batal-${Date.now()}`,
    }),
  });
  cek("transaksi dibuat", jual.status === 200, jual.teks.slice(0, 100));
  const penjualanId = jual.json?.id;
  const totalTransaksi = jual.json?.total ?? 0;

  const stokSetelahJual = await prisma.barang.findUnique({ where: { id: barang.id } });
  cek("stok berkurang 10 (100 → 90)", stokSetelahJual.stok === 90, `dapat ${stokSetelahJual.stok}`);

  const memberSetelahJual = await prisma.member.findUnique({ where: { id: member.id } });
  const poinDiberikan = Math.floor(totalTransaksi / 1000);
  cek("poin member bertambah", memberSetelahJual.poin === poinDiberikan,
    `dapat ${memberSetelahJual.poin}, harusnya ${poinDiberikan}`);

  // Angka SELAGI transaksi masih sah. Setelah dibatalkan, laba harus turun
  // persis sebesar laba transaksi ini — tidak kurang, tidak lebih.
  const labaDenganTransaksi =
    (await api(`/api/laporan?type=penjualan`)).json?.totalLaba ?? 0;
  const distribusiDenganTransaksi =
    (await api(`/api/distribusi?periode=${PERIODE_INI}`)).json?.distribusi?.labaKotor ?? 0;
  const labaTransaksi = totalTransaksi - 10 * 4_000;

  // ── Kasir tidak boleh membatalkan ──
  aktif = "kasir";
  const olehKasir = await api("/api/penjualan", {
    method: "PATCH",
    body: JSON.stringify({ id: penjualanId, aksi: "batal", alasan: "coba-coba saja" }),
  });
  cek("kasir ditolak membatalkan", olehKasir.status === 403, `status ${olehKasir.status}`);
  aktif = "admin";

  // ── Alasan wajib dan cukup panjang ──
  const tanpaAlasan = await api("/api/penjualan", {
    method: "PATCH",
    body: JSON.stringify({ id: penjualanId, aksi: "batal" }),
  });
  cek("alasan wajib diisi", tanpaAlasan.status === 400, tanpaAlasan.json?.error ?? "");

  const alasanPendek = await api("/api/penjualan", {
    method: "PATCH",
    body: JSON.stringify({ id: penjualanId, aksi: "batal", alasan: "oops" }),
  });
  cek("alasan terlalu pendek ditolak", alasanPendek.status === 400, alasanPendek.json?.error ?? "");

  // ── Pembatalan ──
  const batal = await api("/api/penjualan", {
    method: "PATCH",
    body: JSON.stringify({
      id: penjualanId,
      aksi: "batal",
      alasan: "Salah input jumlah barang",
    }),
  });
  cek("pembatalan berhasil", batal.status === 200, batal.teks.slice(0, 120));
  cek("status menjadi batal", batal.json?.status === "batal", batal.json?.status);
  cek("alasan tersimpan", batal.json?.alasanBatal === "Salah input jumlah barang");
  cek("pembatal tercatat", Boolean(batal.json?.dibatalkanOleh?.nama),
    batal.json?.dibatalkanOleh?.nama ?? "kosong");
  cek("waktu pembatalan tercatat", Boolean(batal.json?.dibatalkanPada));

  const stokSetelahBatal = await prisma.barang.findUnique({ where: { id: barang.id } });
  cek("stok dikembalikan (90 → 100)", stokSetelahBatal.stok === 100, `dapat ${stokSetelahBatal.stok}`);

  const memberSetelahBatal = await prisma.member.findUnique({ where: { id: member.id } });
  cek("poin member ditarik kembali", memberSetelahBatal.poin === 0, `dapat ${memberSetelahBatal.poin}`);

  const ulang = await api("/api/penjualan", {
    method: "PATCH",
    body: JSON.stringify({ id: penjualanId, aksi: "batal", alasan: "dibatalkan lagi" }),
  });
  cek("tidak bisa dibatalkan dua kali", ulang.status === 400, ulang.json?.error ?? "");

  const stokSetelahUlang = await prisma.barang.findUnique({ where: { id: barang.id } });
  cek("stok tidak bertambah dua kali", stokSetelahUlang.stok === 100, `dapat ${stokSetelahUlang.stok}`);

  // ── Hilang dari SEMUA perhitungan ──
  const laporan = await api(`/api/laporan?type=penjualan`);
  cek("laba laporan turun persis sebesar laba transaksi yang dibatalkan",
    (laporan.json?.totalLaba ?? 0) === labaDenganTransaksi - labaTransaksi,
    `dapat ${laporan.json?.totalLaba}, harusnya ${labaDenganTransaksi - labaTransaksi}`);

  const distribusi = await api(`/api/distribusi?periode=${PERIODE_INI}`);
  cek("laba distribusi turun dengan angka yang sama",
    (distribusi.json?.distribusi?.labaKotor ?? 0) ===
      distribusiDenganTransaksi - labaTransaksi,
    `dapat ${distribusi.json?.distribusi?.labaKotor}, harusnya ${distribusiDenganTransaksi - labaTransaksi}`);

  const dashboard = await api("/api/dashboard");
  const adaDiTerbaru = (dashboard.json?.transaksiTerbaru ?? []).some(
    (t) => t.id === penjualanId
  );
  cek("tidak muncul di transaksi terbaru dashboard", !adaDiTerbaru);

  cek("transaksi terikat ke shift aktif", Boolean(jual.json?.shiftId),
    jual.json?.shiftId ?? "tidak terikat");

  const shift = await api("/api/shift");
  const shiftTerkait = (shift.json?.data ?? []).find(
    (x) => x.id === jual.json?.shiftId
  );
  cek("shift ditemukan di daftar", Boolean(shiftTerkait));
  cek("rekap kas shift tidak lagi menghitung transaksi batal",
    shiftTerkait?.penjualanTunai === 0,
    `penjualan tunai shift ${shiftTerkait?.penjualanTunai}`);

  const tutupShift = await api("/api/shift", {
    method: "POST",
    body: JSON.stringify({ action: "tutup", saldoAkhir: 200_000, catatan: "uji" }),
  });
  cek("shift ditutup tanpa selisih palsu",
    tutupShift.status === 200 && tutupShift.json?.selisih === 0,
    `selisih ${tutupShift.json?.selisih}, seharusnya ${tutupShift.json?.saldoSeharusnya}`);

  // ── Tetap terlihat di daftar penjualan ──
  const daftar = await api("/api/penjualan?limit=50");
  const baris = (daftar.json?.data ?? []).find((p) => p.id === penjualanId);
  cek("tetap tampil di daftar penjualan", Boolean(baris));
  cek("ditandai batal di daftar", baris?.status === "batal", baris?.status);

  // ── Periode yang sudah ditutup tidak boleh diubah ──
  const lalu = new Date(skrg.getFullYear(), skrg.getMonth() - 1, 15);
  const PERIODE_LALU = `${lalu.getFullYear()}-${String(lalu.getMonth() + 1).padStart(2, "0")}`;

  await prisma.distribusiLaba.deleteMany({ where: { periode: PERIODE_LALU } });
  const penjualanLama = await prisma.penjualan.create({
    data: {
      nomorTransaksi: `BATAL-LAMA-${Date.now()}`,
      tanggal: new Date(Date.UTC(lalu.getFullYear(), lalu.getMonth(), 15, 5)),
      subtotal: 100_000,
      diskon: 0,
      total: 100_000,
      bayar: 100_000,
      kembalian: 0,
      metodeBayar: "Tunai",
      detail: {
        create: [
          { barangId: barang.id, qty: 10, hargaJual: 10_000, hargaBeli: 4_000, subtotal: 100_000 },
        ],
      },
    },
  });

  const tutup = await api("/api/distribusi", {
    method: "POST",
    body: JSON.stringify({ periode: PERIODE_LALU }),
  });
  cek("periode lalu ditutup", tutup.status === 200, tutup.teks.slice(0, 100));

  const batalTerkunci = await api("/api/penjualan", {
    method: "PATCH",
    body: JSON.stringify({
      id: penjualanLama.id,
      aksi: "batal",
      alasan: "mencoba mengubah bulan yang sudah dibagikan",
    }),
  });
  cek("transaksi di periode tertutup TIDAK bisa dibatalkan",
    batalTerkunci.status === 400, batalTerkunci.json?.error ?? "");

  const masihSah = await prisma.penjualan.findUnique({ where: { id: penjualanLama.id } });
  cek("statusnya tidak berubah", masihSah.status === "selesai", masihSah.status);

  // Setelah periode dibuka kembali, pembatalan diizinkan.
  const buka = await api(`/api/distribusi?periode=${PERIODE_LALU}`, { method: "DELETE" });
  cek("master bisa membuka kembali periode", buka.status === 200, `status ${buka.status}`);

  const batalSetelahBuka = await api("/api/penjualan", {
    method: "PATCH",
    body: JSON.stringify({
      id: penjualanLama.id,
      aksi: "batal",
      alasan: "periode sudah dibuka kembali lebih dulu",
    }),
  });
  cek("setelah periode dibuka, pembatalan diizinkan",
    batalSetelahBuka.status === 200, batalSetelahBuka.teks.slice(0, 100));

  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
