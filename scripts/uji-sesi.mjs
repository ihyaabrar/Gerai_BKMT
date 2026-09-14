/**
 * Uji integrasi pencabutan sesi saat password diganti.
 *
 * Skenario yang dijaga: HP kasir hilang, atau akun dipakai orang lain. Pemilik
 * akun mengganti password dari perangkat lain — perangkat yang hilang harus
 * langsung keluar, bukan tetap bisa masuk sampai cookienya kedaluwarsa 12 jam
 * kemudian. Perangkat yang dipakai untuk mengganti password tetap masuk.
 *
 * Skrip ini MENULIS ke database dan hanya boleh dijalankan terhadap database
 * uji, bukan produksi. Jalankan server lebih dulu (npm run build && npm start),
 * lalu: node scripts/uji-sesi.mjs
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

const masuk = (api, username, password) =>
  api("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });

// Sesi dibulatkan per detik; jeda ini memastikan sesi "lama" benar-benar
// terbit sebelum detik pencabutan.
const jeda = () => new Promise((r) => setTimeout(r, 1100));

const PASSWORD_ASLI = "kasir123";
const PASSWORD_BARU = "kasir-baru-456";

async function main() {
  console.log();
  const admin = sesi();
  cek("login admin", (await masuk(admin, "admin", "admin123")).status === 200);
  const kasir = await prisma.user.findUnique({ where: { username: "kasir" } });

  try {
    // ── 1. Kasir mengganti passwordnya sendiri ──
    console.log("[Ganti password sendiri]");
    const hp = sesi();       // perangkat yang "hilang"
    const laptop = sesi();   // perangkat yang dipakai mengganti password
    cek("login di HP", (await masuk(hp, "kasir", PASSWORD_ASLI)).status === 200);
    cek("login di laptop", (await masuk(laptop, "kasir", PASSWORD_ASLI)).status === 200);
    await jeda();

    const ganti = await laptop("/api/auth/password", {
      method: "POST",
      body: JSON.stringify({ passwordLama: PASSWORD_ASLI, passwordBaru: PASSWORD_BARU }),
    });
    cek("password diganti dari laptop", ganti.status === 200, ganti.teks.slice(0, 100));

    cek("laptop tetap masuk", (await laptop("/api/auth/me")).status === 200);
    cek("laptop tetap bisa bekerja", (await laptop("/api/barang")).status === 200);
    cek("HP langsung keluar (401 di /api/auth/me)", (await hp("/api/auth/me")).status === 401);
    const hpApi = await hp("/api/barang");
    cek("HP tidak bisa memakai API lagi", hpApi.status === 401 || hpApi.status === 403,
      `status ${hpApi.status}`);

    cek("password lama tidak bisa dipakai login",
      (await masuk(sesi(), "kasir", PASSWORD_ASLI)).status === 401);
    const baru = sesi();
    cek("password baru bisa dipakai login", (await masuk(baru, "kasir", PASSWORD_BARU)).status === 200);
    cek("sesi dari login baru berlaku", (await baru("/api/auth/me")).status === 200);

    // ── 2. Master menyetel ulang password kasir ──
    console.log("[Master menyetel ulang password]");
    await jeda();
    const reset = await admin("/api/user", {
      method: "PATCH",
      body: JSON.stringify({ id: kasir.id, password: PASSWORD_ASLI }),
    });
    cek("master menyetel ulang password kasir", reset.status === 200, reset.teks.slice(0, 100));
    cek("laptop kasir keluar", (await laptop("/api/auth/me")).status === 401);
    cek("sesi login baru kasir juga keluar", (await baru("/api/auth/me")).status === 401);
    cek("master sendiri tetap masuk", (await admin("/api/auth/me")).status === 200);

    // ── 3. Master menyetel ulang password akunnya sendiri ──
    console.log("[Master mengganti password sendiri lewat Pengguna]");
    const adminLain = sesi();
    cek("admin login di perangkat kedua", (await masuk(adminLain, "admin", "admin123")).status === 200);
    await jeda();
    const adminDb = await prisma.user.findUnique({ where: { username: "admin" } });
    const resetSendiri = await admin("/api/user", {
      method: "PATCH",
      body: JSON.stringify({ id: adminDb.id, password: "admin123" }),
    });
    cek("master menyetel password sendiri", resetSendiri.status === 200);
    cek("perangkat yang dipakai tetap masuk", (await admin("/api/auth/me")).status === 200);
    cek("perangkat kedua keluar", (await adminLain("/api/auth/me")).status === 401);
  } finally {
    // Password uji dikembalikan supaya skrip lain tetap bisa login.
    const bcrypt = (await import("bcryptjs")).default;
    await prisma.user.update({
      where: { id: kasir.id },
      data: { password: await bcrypt.hash(PASSWORD_ASLI, 12) },
    });
  }

  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
