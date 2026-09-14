/**
 * Uji integrasi pengelolaan barang.
 *
 *  1. Harga jual yang diubah lewat Edit Barang langsung dipakai kasir, dan
 *     laba penjualan yang sudah terjadi tidak ikut berubah.
 *  2. Stok tidak bisa diubah lewat Edit Barang (harus lewat Barang Masuk atau
 *     Penyesuaian supaya tercatat).
 *  3. Kode dan barcode kembar ditolak dengan pesan yang jelas.
 *  4. Kasir tidak bisa mengubah barang.
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

  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
