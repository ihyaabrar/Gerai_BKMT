/**
 * Uji integrasi retur pembeli.
 *
 *  - Uang kembali mengikuti diskon member, dan totalnya tidak pernah melebihi
 *    yang dibayar pembeli.
 *  - Barang yang kembali ke rak menambah stok dan hanya mengurangi margin;
 *    barang rusak tidak menambah stok dan mengurangi seluruh uang kembaliannya.
 *  - Jumlah retur tidak bisa melebihi yang dibeli.
 *  - Poin member ditarik; refund tunai mengurangi saldo laci shift.
 *  - Transaksi yang sudah diretur tidak bisa dibatalkan; transaksi batal tidak
 *    bisa diretur; kasir tidak bisa meretur.
 *
 * Skrip ini MENULIS ke database dan hanya boleh dijalankan terhadap database
 * uji, bukan produksi. Jalankan server lebih dulu (npm run build && npm start),
 * lalu: node scripts/uji-retur.mjs
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

  const barang = await prisma.barang.upsert({
    where: { kode: "UJI-RETUR" },
    update: { hargaBeli: 6_000, hargaJual: 10_000, stok: 100, aktif: true },
    create: { kode: "UJI-RETUR", nama: "Barang Uji Retur", hargaBeli: 6_000, hargaJual: 10_000, stok: 100, aktif: true },
  });
  const member = await prisma.member.upsert({
    where: { kode: "UJIRETUR" },
    update: { poin: 500, aktif: true },
    create: { kode: "UJIRETUR", nama: "Member Uji Retur", poin: 500 },
  });

  // Shift baru supaya rekap kasnya bersih.
  const aktif = (await admin("/api/shift")).json?.shiftAktif;
  if (aktif) {
    await admin("/api/shift", { method: "POST", body: JSON.stringify({ action: "tutup", saldoAkhir: 0, catatan: "uji retur" }) });
  }
  const shift = await admin("/api/shift", { method: "POST", body: JSON.stringify({ action: "buka", saldoAwal: 100_000 }) });
  cek("shift dibuka", shift.status === 200);

  const jual = await kasir("/api/penjualan", {
    method: "POST",
    body: JSON.stringify({
      items: [{ id: barang.id, qty: 10 }], bayar: 200_000, metodeBayar: "Tunai",
      memberId: member.id, idempotencyKey: kunci(),
    }),
  });
  cek("penjualan 10 barang dengan member", jual.status === 200, jual.teks.slice(0, 100));
  const p = jual.json;
  const rasio = p.total / p.subtotal;
  cek("ada diskon member (total < subtotal)", p.total < p.subtotal, `${p.subtotal} → ${p.total}`);

  const info = await admin(`/api/retur-penjualan?penjualanId=${p.id}`);
  const baris = info.json?.detail?.[0];
  cek("rincian retur terbaca, sisa 10", info.status === 200 && baris?.sisaBisaRetur === 10);
  cek("perkiraan uang kembali per barang sudah dipotong diskon",
    baris?.refundPerUnit === Math.round(10_000 * rasio), `${baris?.refundPerUnit}`);

  const labaIni = async () => (await admin("/api/distribusi")).json?.distribusi;
  const poinSetelahJual = (await prisma.member.findUnique({ where: { id: member.id } })).poin;
  const stokSetelahJual = (await prisma.barang.findUnique({ where: { id: barang.id } })).stok;
  const labaAwal = (await labaIni()).labaKotor;

  // ── Retur barang utuh ──
  console.log("[Retur 2 barang utuh]");
  const r1 = await admin("/api/retur-penjualan", {
    method: "POST",
    body: JSON.stringify({ penjualanId: p.id, alasan: "Uji: salah ukuran", items: [{ detailPenjualanId: baris.id, qty: 2, kembaliKeStok: true }] }),
  });
  const refund1 = Math.round(20_000 * rasio);
  cek("retur tercatat", r1.status === 200, r1.teks.slice(0, 120));
  cek("uang kembali mengikuti diskon", r1.json?.totalRefund === refund1, `${r1.json?.totalRefund} vs ${refund1}`);
  cek("pesan menyebut uang tunai dari laci", (r1.json?.pesan ?? "").includes("laci"));
  cek("stok bertambah 2",
    (await prisma.barang.findUnique({ where: { id: barang.id } })).stok === stokSetelahJual + 2);
  const laba1 = (await labaIni()).labaKotor;
  cek("laba turun sebesar uang kembali − harga pokok yang kembali",
    labaAwal - laba1 === refund1 - 12_000, `turun ${labaAwal - laba1}, harusnya ${refund1 - 12_000}`);
  cek("poin member ditarik",
    (await prisma.member.findUnique({ where: { id: member.id } })).poin === poinSetelahJual - Math.floor(refund1 / 1000));

  // ── Retur barang rusak ──
  console.log("[Retur 3 barang rusak]");
  const r2 = await admin("/api/retur-penjualan", {
    method: "POST",
    body: JSON.stringify({ penjualanId: p.id, alasan: "Uji: kemasan bocor", items: [{ detailPenjualanId: baris.id, qty: 3, kembaliKeStok: false }] }),
  });
  const refund2 = Math.round(30_000 * rasio);
  cek("retur rusak tercatat", r2.status === 200, r2.teks.slice(0, 100));
  cek("stok tidak bertambah",
    (await prisma.barang.findUnique({ where: { id: barang.id } })).stok === stokSetelahJual + 2);
  const laba2 = (await labaIni()).labaKotor;
  cek("laba turun sebesar seluruh uang kembali", laba1 - laba2 === refund2, `turun ${laba1 - laba2}, harusnya ${refund2}`);

  // ── Batas jumlah ──
  console.log("[Batas]");
  const lebih = await admin("/api/retur-penjualan", {
    method: "POST",
    body: JSON.stringify({ penjualanId: p.id, alasan: "Uji: melebihi", items: [{ detailPenjualanId: baris.id, qty: 6 }] }),
  });
  cek("retur melebihi sisa ditolak (400)", lebih.status === 400, lebih.json?.error ?? "");

  const batalkan = await admin("/api/penjualan", {
    method: "PATCH", body: JSON.stringify({ id: p.id, aksi: "batal", alasan: "uji batal setelah retur" }),
  });
  cek("transaksi yang sudah diretur tidak bisa dibatalkan", batalkan.status === 400, batalkan.json?.error ?? "");

  const kasirRetur = await kasir("/api/retur-penjualan", {
    method: "POST",
    body: JSON.stringify({ penjualanId: p.id, alasan: "Uji: kasir", items: [{ detailPenjualanId: baris.id, qty: 1 }] }),
  });
  cek("kasir tidak bisa meretur (403)", kasirRetur.status === 403, `status ${kasirRetur.status}`);

  const sisa = await admin("/api/retur-penjualan", {
    method: "POST",
    body: JSON.stringify({ penjualanId: p.id, alasan: "Uji: sisa semua", items: [{ detailPenjualanId: baris.id, qty: 5 }] }),
  });
  cek("sisa 5 diretur", sisa.status === 200);
  const semuaRetur = await prisma.returPenjualan.findMany({ where: { penjualanId: p.id } });
  const totalKembali = semuaRetur.reduce((s, r) => s + r.totalRefund, 0);
  cek("total uang kembali persis sama dengan yang dibayar", totalKembali === p.total, `${totalKembali} vs ${p.total}`);

  const habis = await admin("/api/retur-penjualan", {
    method: "POST",
    body: JSON.stringify({ penjualanId: p.id, alasan: "Uji: sudah habis", items: [{ detailPenjualanId: baris.id, qty: 1 }] }),
  });
  cek("barang yang sudah diretur semua ditolak", habis.status === 400, habis.json?.error ?? "");

  // ── Transaksi batal ──
  const jual2 = await kasir("/api/penjualan", {
    method: "POST",
    body: JSON.stringify({ items: [{ id: barang.id, qty: 1 }], bayar: 10_000, metodeBayar: "Tunai", idempotencyKey: kunci() }),
  });
  await admin("/api/penjualan", {
    method: "PATCH", body: JSON.stringify({ id: jual2.json.id, aksi: "batal", alasan: "uji retur transaksi batal" }),
  });
  const info2 = await admin(`/api/retur-penjualan?penjualanId=${jual2.json.id}`);
  const returBatal = await admin("/api/retur-penjualan", {
    method: "POST",
    body: JSON.stringify({ penjualanId: jual2.json.id, alasan: "Uji: transaksi batal", items: [{ detailPenjualanId: info2.json.detail[0].id, qty: 1 }] }),
  });
  cek("transaksi yang dibatalkan tidak bisa diretur", returBatal.status === 400, returBatal.json?.error ?? "");

  // ── Laporan & kas shift ──
  console.log("[Laporan & kas]");
  const laporan = await admin("/api/laporan?type=penjualan");
  cek("laporan mencatat retur", (laporan.json?.totalRetur ?? 0) >= p.total, `${laporan.json?.totalRetur}`);

  const rekap = await admin("/api/shift");
  const s = (rekap.json?.data ?? []).find((x) => x.id === shift.json.id);
  cek("rekap shift mencatat refund tunai", s?.refundTunai === p.total, `${s?.refundTunai}`);
  const seharusnya = 100_000 + s.penjualanTunai - p.total;
  cek("saldo seharusnya = awal + penjualan tunai − refund", s?.saldoSeharusnya === seharusnya,
    `${s?.saldoSeharusnya} vs ${seharusnya}`);

  const tutup = await admin("/api/shift", {
    method: "POST", body: JSON.stringify({ action: "tutup", saldoAkhir: seharusnya, catatan: "uji retur" }),
  });
  cek("shift ditutup tanpa selisih", tutup.status === 200 && tutup.json?.selisih === 0, `selisih ${tutup.json?.selisih}`);

  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
