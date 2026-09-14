/**
 * Uji integrasi untuk angka yang, sekali tercatat, tidak boleh bergeser diam-diam.
 *
 *  1. Kunci transaksi yang dipakai ulang untuk keranjang yang BERBEDA harus
 *     ditolak — bukan mengembalikan struk transaksi lama seolah-olah berhasil.
 *  2. Daftar nasabah dan persentase bagi hasil tidak boleh diubah selama
 *     distribusi bulan lalu belum ditutup.
 *  3. Membuka kembali distribusi wajib beralasan, meninggalkan arsip, dan
 *     penutupan ulang memakai daftar nasabah yang sama dengan penutupan pertama.
 *  4. Selisih kas shift yang sudah ditutup tidak berubah walau transaksinya
 *     dibatalkan belakangan.
 *
 * Skrip ini MENULIS ke database dan hanya boleh dijalankan terhadap database
 * uji, bukan produksi. Jalankan server lebih dulu (npm run build && npm start),
 * lalu: node scripts/uji-penguncian.mjs
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

const kunci = () => `uji-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// Periode dihitung dalam WIB, sama seperti aplikasi.
const periodeWIB = (d) => {
  const w = new Date(d.getTime() + 7 * 3600_000);
  return `${w.getUTCFullYear()}-${String(w.getUTCMonth() + 1).padStart(2, "0")}`;
};
const sekarangWIB = new Date(Date.now() + 7 * 3600_000);
const PERIODE_LALU = periodeWIB(
  new Date(Date.UTC(sekarangWIB.getUTCFullYear(), sekarangWIB.getUTCMonth() - 1, 15))
);
const [thn, bln] = PERIODE_LALU.split("-").map(Number);
const TENGAH_BULAN_LALU = new Date(Date.UTC(thn, bln - 1, 15, 5)); // 12.00 WIB

async function bersihkan() {
  await prisma.distribusiLaba.deleteMany({ where: { periode: PERIODE_LALU } });
  await prisma.distribusiLabaArsip.deleteMany({ where: { periode: PERIODE_LALU } });
  await prisma.detailPenjualan.deleteMany({
    where: { penjualan: { nomorTransaksi: { startsWith: "UJIKUNCI" } } },
  });
  await prisma.penjualan.deleteMany({ where: { nomorTransaksi: { startsWith: "UJIKUNCI" } } });
  await prisma.nasabah.deleteMany({ where: { nama: { startsWith: "Uji Kunci " } } });
}

async function main() {
  console.log();
  console.log(`Periode bulan lalu: ${PERIODE_LALU}`);

  await bersihkan();

  const barang = await prisma.barang.upsert({
    where: { kode: "UJI-KUNCI" },
    update: { hargaBeli: 4_000, hargaJual: 10_000, stok: 100, aktif: true },
    create: {
      kode: "UJI-KUNCI",
      nama: "Barang Uji Penguncian",
      hargaBeli: 4_000,
      hargaJual: 10_000,
      stok: 100,
      aktif: true,
    },
  });

  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  cek("login", login.status === 200, `status ${login.status}`);

  const jual = (k, qty, metodeBayar = "Tunai") =>
    api("/api/penjualan", {
      method: "POST",
      body: JSON.stringify({
        items: [{ id: barang.id, qty }],
        bayar: 1_000_000,
        metodeBayar,
        idempotencyKey: k,
      }),
    });

  // ── 1. Kunci dipakai ulang untuk keranjang lain ──
  console.log("\n[Kunci transaksi]");
  const k = kunci();
  const pertama = await jual(k, 2);
  cek("transaksi pertama berhasil", pertama.status === 200, pertama.teks.slice(0, 100));

  const samaPersis = await jual(k, 2);
  cek("percobaan ulang yang sama mengembalikan transaksi yang sama",
    samaPersis.status === 200 && samaPersis.json?.id === pertama.json?.id);

  const beda = await jual(k, 5);
  cek("kunci sama, isi berbeda → 409", beda.status === 409, `status ${beda.status}`);
  cek("pesannya menyebut nomor transaksi yang sudah tercatat",
    (beda.json?.error ?? "").includes(pertama.json?.nomorTransaksi ?? "???"),
    beda.json?.error ?? "");

  const bedaMetode = await jual(k, 2, "QRIS");
  cek("kunci sama, metode bayar berbeda → 409", bedaMetode.status === 409,
    `status ${bedaMetode.status}`);

  const stok = await prisma.barang.findUnique({ where: { id: barang.id } });
  cek("stok hanya terpotong sekali (2)", stok.stok === 98, `stok ${stok.stok}`);
  const jumlahDenganKunci = await prisma.penjualan.count({ where: { idempotencyKey: k } });
  cek("hanya satu penjualan untuk kunci itu", jumlahDenganKunci === 1, `${jumlahDenganKunci}`);

  // ── 2. Nasabah & persentase terkunci sampai bulan lalu ditutup ──
  console.log("\n[Penguncian perubahan nasabah]");
  const lama = await prisma.penjualan.create({
    data: {
      nomorTransaksi: `UJIKUNCI${Date.now()}`,
      subtotal: 50_000,
      tanggal: TENGAH_BULAN_LALU,
      total: 50_000,
      bayar: 50_000,
      kembalian: 0,
      metodeBayar: "Tunai",
      status: "selesai",
      detail: {
        create: [{ barangId: barang.id, qty: 5, hargaBeli: 4_000, hargaJual: 10_000, subtotal: 50_000 }],
      },
    },
  });
  cek("penjualan bulan lalu disiapkan", Boolean(lama.id));

  const tambahTerkunci = await api("/api/nasabah", {
    method: "POST",
    body: JSON.stringify({ nama: "Uji Kunci Baru", jumlahInvestasi: 1_000_000 }),
  });
  cek("menambah nasabah ditolak (409)", tambahTerkunci.status === 409,
    `status ${tambahTerkunci.status}`);
  cek("pesannya menyuruh menutup distribusi",
    (tambahTerkunci.json?.error ?? "").includes("Distribusi Laba"),
    tambahTerkunci.json?.error ?? "");

  const pengaturanAwal = (await api("/api/pengaturan")).json;
  const simpanPengaturan = (ubah) =>
    api("/api/pengaturan", {
      method: "POST",
      body: JSON.stringify({
        namaToko: pengaturanAwal.namaToko,
        alamatToko: pengaturanAwal.alamatToko,
        teleponToko: pengaturanAwal.teleponToko,
        prefixTransaksi: pengaturanAwal.prefixTransaksi,
        diskonMember: pengaturanAwal.diskonMember,
        persenNasabah: pengaturanAwal.persenNasabah,
        persenPengelola: pengaturanAwal.persenPengelola,
        ...ubah,
      }),
    });

  const ubahPersen = await simpanPengaturan({
    persenNasabah: pengaturanAwal.persenNasabah + 5,
    persenPengelola: pengaturanAwal.persenPengelola - 5,
  });
  cek("mengubah persentase ditolak (409)", ubahPersen.status === 409, `status ${ubahPersen.status}`);

  const ubahLain = await simpanPengaturan({ diskonMember: pengaturanAwal.diskonMember });
  cek("menyimpan pengaturan tanpa mengubah persentase tetap boleh",
    ubahLain.status === 200, `status ${ubahLain.status}`);

  const tidakPas = await simpanPengaturan({ persenNasabah: 30.5, persenPengelola: 70 });
  cek("persentase yang tidak berjumlah 100 ditolak (400)", tidakPas.status === 400,
    `status ${tidakPas.status}`);

  // Nasabah uji disiapkan langsung di database; yang lain dinonaktifkan dulu
  // agar pembagian mudah diperiksa. (Aman: skrip ini hanya untuk database uji.)
  await prisma.nasabah.updateMany({ data: { aktif: false } });
  const nA = await prisma.nasabah.create({
    data: { nama: "Uji Kunci A", jumlahInvestasi: 6_000_000, persentase: 60, aktif: true },
  });
  const nB = await prisma.nasabah.create({
    data: { nama: "Uji Kunci B", jumlahInvestasi: 4_000_000, persentase: 40, aktif: true },
  });

  const tutup = await api("/api/distribusi", {
    method: "POST",
    body: JSON.stringify({ periode: PERIODE_LALU }),
  });
  cek("distribusi bulan lalu ditutup", tutup.status === 200, tutup.teks.slice(0, 120));
  const bagianAwal = tutup.json?.distribusi?.bagianNasabah;

  const tambahSetelahTutup = await api("/api/nasabah", {
    method: "POST",
    body: JSON.stringify({ nama: "Uji Kunci C", jumlahInvestasi: 10_000_000 }),
  });
  cek("setelah ditutup, menambah nasabah diizinkan", tambahSetelahTutup.status === 200,
    tambahSetelahTutup.teks.slice(0, 100));

  // ── 3. Buka kembali: alasan, arsip, daftar nasabah yang sama ──
  console.log("\n[Buka kembali distribusi]");
  const tanpaAlasan = await api(`/api/distribusi?periode=${PERIODE_LALU}`, { method: "DELETE" });
  cek("tanpa alasan ditolak (400)", tanpaAlasan.status === 400, `status ${tanpaAlasan.status}`);

  const alasanPendek = await api(`/api/distribusi?periode=${PERIODE_LALU}&alasan=salah`, {
    method: "DELETE",
  });
  cek("alasan terlalu pendek ditolak (400)", alasanPendek.status === 400,
    `status ${alasanPendek.status}`);

  const alasan = "Uji: ada transaksi yang salah input";
  const buka = await api(
    `/api/distribusi?periode=${PERIODE_LALU}&alasan=${encodeURIComponent(alasan)}`,
    { method: "DELETE" }
  );
  cek("dengan alasan, periode dibuka kembali", buka.status === 200, buka.teks.slice(0, 100));

  const arsip = await prisma.distribusiLabaArsip.findMany({ where: { periode: PERIODE_LALU } });
  cek("satu arsip tersimpan", arsip.length === 1, `${arsip.length}`);
  cek("arsip mencatat alasan dan pembukanya",
    arsip[0]?.alasan === alasan && Boolean(arsip[0]?.dibukaOlehId));
  cek("arsip menyimpan bagian setiap nasabah",
    arsip[0]?.data?.detail?.length === 2 && arsip[0]?.data?.bagianNasabah === bagianAwal,
    `detail ${arsip[0]?.data?.detail?.length}, bagian ${arsip[0]?.data?.bagianNasabah}`);

  const pratinjau = await api(`/api/distribusi?periode=${PERIODE_LALU}`);
  cek("pratinjau memakai daftar nasabah dari arsip",
    pratinjau.json?.distribusi?.rosterDariArsip === true);
  cek("nasabah yang mendaftar setelah penutupan tidak ikut",
    pratinjau.json?.distribusi?.detail?.length === 2 &&
      !pratinjau.json.distribusi.detail.some((d) => d.namaNasabah === "Uji Kunci C"),
    (pratinjau.json?.distribusi?.detail ?? []).map((d) => d.namaNasabah).join(", "));
  cek("riwayat buka kembali terbaca", pratinjau.json?.riwayatBuka?.length === 1);

  const tutupUlang = await api("/api/distribusi", {
    method: "POST",
    body: JSON.stringify({ periode: PERIODE_LALU }),
  });
  cek("ditutup ulang", tutupUlang.status === 200, tutupUlang.teks.slice(0, 120));
  const idUlang = (tutupUlang.json?.distribusi?.detail ?? []).map((d) => d.nasabahId).sort();
  cek("penutupan ulang untuk nasabah yang sama",
    JSON.stringify(idUlang) === JSON.stringify([nA.id, nB.id].sort()));
  cek("angkanya sama karena transaksinya tidak berubah",
    bagianAwal > 0 && tutupUlang.json?.distribusi?.bagianNasabah === bagianAwal,
    `${tutupUlang.json?.distribusi?.bagianNasabah} vs ${bagianAwal}`);

  // ── 4. Selisih shift dibekukan saat ditutup ──
  console.log("\n[Shift dibekukan]");
  const aktif = (await api("/api/shift")).json?.shiftAktif;
  if (aktif) {
    await api("/api/shift", {
      method: "POST",
      body: JSON.stringify({ action: "tutup", saldoAkhir: aktif.saldoAwal, catatan: "uji" }),
    });
  }

  const bukaShift = await api("/api/shift", {
    method: "POST",
    body: JSON.stringify({ action: "buka", saldoAwal: 100_000 }),
  });
  cek("shift dibuka", bukaShift.status === 200, bukaShift.teks.slice(0, 100));

  const jualShift = await jual(kunci(), 1);
  cek("penjualan tunai di shift", jualShift.status === 200 && jualShift.json?.total === 10_000,
    `total ${jualShift.json?.total}`);

  const tutupShift = await api("/api/shift", {
    method: "POST",
    body: JSON.stringify({ action: "tutup", saldoAkhir: 110_000, catatan: "uji beku" }),
  });
  cek("shift ditutup tanpa selisih", tutupShift.status === 200 && tutupShift.json?.selisih === 0,
    `selisih ${tutupShift.json?.selisih}`);

  const batal = await api("/api/penjualan", {
    method: "PATCH",
    body: JSON.stringify({ id: jualShift.json?.id, aksi: "batal", alasan: "dibatalkan esok hari" }),
  });
  cek("transaksinya dibatalkan belakangan", batal.status === 200, batal.teks.slice(0, 100));

  const riwayat = await api("/api/shift");
  const s = (riwayat.json?.data ?? []).find((x) => x.id === bukaShift.json?.id);
  cek("selisih shift tetap 0 (tidak menjadi +10.000)", s?.selisih === 0, `selisih ${s?.selisih}`);
  cek("penjualan tunai shift tetap 10.000", s?.penjualanTunai === 10_000,
    `tunai ${s?.penjualanTunai}`);
  cek("ditandai sebagai angka beku", s?.angkaBeku === true);

  await bersihkan();
  console.log();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
