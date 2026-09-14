/**
 * Uji integrasi aturan modal nasabah (keputusan pengurus, September 2026):
 * nasabah baru, perubahan modal, dan nasabah yang berhenti berlaku mulai
 * BULAN BERIKUTNYA. Koreksi salah ketik dan "salah input" berlaku langsung.
 *
 * Skrip ini MENULIS ke database dan hanya boleh dijalankan terhadap database
 * uji, bukan produksi. Jalankan server lebih dulu (npm run build && npm start),
 * lalu: node scripts/uji-nasabah.mjs
 */
import { PrismaClient } from "@prisma/client";
import { pastikanDatabaseLokal } from "./_hanya-lokal.mjs";

pastikanDatabaseLokal();
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

const periodeWIB = (d) => {
  const w = new Date(d.getTime() + 7 * 3600_000);
  return `${w.getUTCFullYear()}-${String(w.getUTCMonth() + 1).padStart(2, "0")}`;
};
const PERIODE_INI = periodeWIB(new Date());
const [th, bl] = PERIODE_INI.split("-").map(Number);
const PERIODE_DEPAN = bl === 12 ? `${th + 1}-01` : `${th}-${String(bl + 1).padStart(2, "0")}`;
const PERIODE_TUTUP = "2024-06";

/** Modal per nama nasabah pada pratinjau distribusi sebuah periode. */
const roster = async (periode) => {
  const r = await api(`/api/distribusi?periode=${periode}`);
  return Object.fromEntries(
    (r.json?.distribusi?.detail ?? []).map((d) => [d.namaNasabah, d.jumlahInvestasi])
  );
};

async function bersihkan() {
  await prisma.distribusiLaba.deleteMany({ where: { periode: PERIODE_TUTUP } });
  await prisma.nasabah.deleteMany({ where: { nama: { startsWith: "Uji Modal " } } });
}

async function main() {
  console.log();
  console.log(`Bulan ini ${PERIODE_INI}, bulan depan ${PERIODE_DEPAN}`);
  await bersihkan();

  cek("login", (await api("/api/auth/login", {
    method: "POST", body: JSON.stringify({ username: "admin", password: "admin123" }),
  })).status === 200);

  // Hanya database uji: nasabah lain dikeluarkan supaya daftar mudah diperiksa.
  await prisma.nasabah.updateMany({ data: { aktif: false } });
  await prisma.modalNasabah.deleteMany({});
  const buatLama = (nama, jumlah) =>
    prisma.nasabah.create({
      data: {
        nama, jumlahInvestasi: jumlah, persentase: 0, aktif: true,
        modal: { create: { berlakuMulai: "2000-01", jumlah, aktif: true } },
      },
    });
  const x = await buatLama("Uji Modal X", 10_000_000);
  const y = await buatLama("Uji Modal Y", 10_000_000);

  // ── Nasabah baru ──
  console.log("[Nasabah baru]");
  const z = await api("/api/nasabah", {
    method: "POST", body: JSON.stringify({ nama: "Uji Modal Z", jumlahInvestasi: 20_000_000 }),
  });
  cek("nasabah baru tersimpan", z.status === 200, z.teks.slice(0, 100));
  cek("berlaku mulai bulan depan", z.json?.berlakuMulai === PERIODE_DEPAN, z.json?.berlakuMulai);
  let ini = await roster(PERIODE_INI);
  let depan = await roster(PERIODE_DEPAN);
  cek("belum ikut dibagi bulan ini", !("Uji Modal Z" in ini), Object.keys(ini).join(", "));
  cek("ikut dibagi bulan depan", depan["Uji Modal Z"] === 20_000_000, JSON.stringify(depan));

  const daftar = await api("/api/nasabah");
  const zDiDaftar = (daftar.json ?? []).find((n) => n.nama === "Uji Modal Z");
  cek("daftar menandai modal bulan ini 0 dan perubahan tertunda",
    zDiDaftar?.modalBulanIni === 0 && zDiDaftar?.perubahanTertunda?.berlakuMulai === PERIODE_DEPAN);

  // ── Tambah modal ──
  console.log("[Tambah modal]");
  const tambah = await api("/api/nasabah", {
    method: "PATCH", body: JSON.stringify({ id: x.id, nama: "Uji Modal X", jumlahInvestasi: 30_000_000 }),
  });
  cek("tambah modal tersimpan", tambah.status === 200 && tambah.json?.berlakuMulai === PERIODE_DEPAN,
    tambah.teks.slice(0, 100));
  ini = await roster(PERIODE_INI);
  depan = await roster(PERIODE_DEPAN);
  cek("bulan ini masih modal lama (10 juta)", ini["Uji Modal X"] === 10_000_000, `${ini["Uji Modal X"]}`);
  cek("bulan depan modal baru (30 juta)", depan["Uji Modal X"] === 30_000_000, `${depan["Uji Modal X"]}`);

  await api("/api/nasabah", {
    method: "PATCH", body: JSON.stringify({ id: x.id, nama: "Uji Modal X", jumlahInvestasi: 25_000_000 }),
  });
  const barisDepan = await prisma.modalNasabah.count({ where: { nasabahId: x.id, berlakuMulai: PERIODE_DEPAN } });
  cek("dua perubahan dalam sebulan menjadi satu baris", barisDepan === 1, `${barisDepan}`);
  cek("yang dipakai perubahan terakhir (25 juta)", (await roster(PERIODE_DEPAN))["Uji Modal X"] === 25_000_000);

  // ── Koreksi salah ketik ──
  console.log("[Koreksi salah ketik]");
  const koreksi = await api("/api/nasabah", {
    method: "PATCH",
    body: JSON.stringify({ id: y.id, nama: "Uji Modal Y", jumlahInvestasi: 5_000_000, koreksi: true }),
  });
  cek("koreksi tersimpan", koreksi.status === 200 && koreksi.json?.koreksi === true, koreksi.teks.slice(0, 100));
  cek("koreksi langsung berlaku bulan ini", (await roster(PERIODE_INI))["Uji Modal Y"] === 5_000_000);

  // ── Berhenti ──
  console.log("[Berhenti]");
  const berhenti = await api(`/api/nasabah?id=${x.id}&mode=berhenti`, { method: "DELETE" });
  cek("berhenti tersimpan", berhenti.status === 200 && berhenti.json?.berlakuMulai === PERIODE_DEPAN,
    berhenti.teks.slice(0, 100));
  ini = await roster(PERIODE_INI);
  depan = await roster(PERIODE_DEPAN);
  cek("masih mendapat bagian bulan ini", ini["Uji Modal X"] === 10_000_000, JSON.stringify(ini));
  cek("tidak lagi dibagi bulan depan", !("Uji Modal X" in depan), JSON.stringify(depan));
  const daftar2 = await api("/api/nasabah");
  cek("hilang dari daftar nasabah aktif", !(daftar2.json ?? []).some((n) => n.id === x.id));

  // ── Salah input ──
  console.log("[Salah input]");
  const salah = await api(`/api/nasabah?id=${z.json.id}&mode=salah-input`, { method: "DELETE" });
  cek("salah input dihapus", salah.status === 200, salah.teks.slice(0, 100));
  cek("tidak ikut bulan depan", !("Uji Modal Z" in (await roster(PERIODE_DEPAN))));
  cek("riwayat modalnya terhapus", (await prisma.modalNasabah.count({ where: { nasabahId: z.json.id } })) === 0);

  // Nasabah lama yang dianggap salah input juga langsung keluar dari bulan ini —
  // inilah jalan untuk data contoh yang terlanjur masuk ke produksi.
  const contoh = await buatLama("Uji Modal Contoh", 4_000_000);
  cek("data contoh ikut dibagi sebelum dihapus", (await roster(PERIODE_INI))["Uji Modal Contoh"] === 4_000_000);
  await api(`/api/nasabah?id=${contoh.id}&mode=salah-input`, { method: "DELETE" });
  cek("data contoh langsung keluar dari bulan ini", !("Uji Modal Contoh" in (await roster(PERIODE_INI))));

  const pernah = await buatLama("Uji Modal Pernah", 3_000_000);
  await prisma.distribusiLaba.create({
    data: {
      periode: PERIODE_TUTUP,
      periodeMulai: new Date(Date.UTC(2024, 4, 31, 17)),
      periodeSelesai: new Date(Date.UTC(2024, 5, 30, 16, 59, 59)),
      totalPenjualan: 0, totalHpp: 0, totalDiskon: 0, labaKotor: 0,
      persenNasabah: 30, persenPengelola: 70, bagianNasabah: 0, bagianPengelola: 0, totalInvestasi: 3_000_000,
      detail: { create: [{ nasabahId: pernah.id, namaNasabah: pernah.nama, jumlahInvestasi: 3_000_000, persentase: 100, bagian: 0 }] },
    },
  });
  const tolak = await api(`/api/nasabah?id=${pernah.id}&mode=salah-input`, { method: "DELETE" });
  cek("nasabah yang pernah menerima bagian tidak bisa dihapus sebagai salah input", tolak.status === 400,
    tolak.json?.error ?? `status ${tolak.status}`);

  await bersihkan();
  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
