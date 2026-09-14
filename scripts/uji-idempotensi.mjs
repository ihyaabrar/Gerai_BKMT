/**
 * Uji integrasi idempotensi penjualan.
 *
 * Pertanyaan yang dijawab berkas ini: kalau kasir menekan Bayar dua kali
 * karena respons pertama hilang di jalan, apakah transaksinya tercatat dua
 * kali dan stoknya terpotong dua kali? Jawabannya harus TIDAK.
 *
 * Juga menguji bahwa dua kasir yang menjual barang terakhir bersamaan tidak
 * bisa lolos keduanya (stok tidak boleh menjadi negatif).
 *
 * Skrip ini MENULIS ke database dan hanya boleh dijalankan terhadap database
 * uji, bukan produksi. Jalankan server lebih dulu (npm run build && npm start),
 * lalu: node scripts/uji-idempotensi.mjs
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

async function main() {
  console.log();

  const barang = await prisma.barang.upsert({
    where: { kode: "UJI-IDEM" },
    update: { hargaBeli: 4_000, hargaJual: 10_000, stok: 100, aktif: true },
    create: {
      kode: "UJI-IDEM",
      nama: "Barang Uji Idempotensi",
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

  const jual = (k, qty = 3) =>
    api("/api/penjualan", {
      method: "POST",
      body: JSON.stringify({
        items: [{ id: barang.id, qty }],
        bayar: 1_000_000,
        metodeBayar: "Tunai",
        idempotencyKey: k,
      }),
    });

  // ── 1. Percobaan ulang berurutan ──
  const k1 = kunci();
  const a = await jual(k1);
  const b = await jual(k1);
  cek("transaksi pertama berhasil", a.status === 200, a.teks.slice(0, 100));
  cek("percobaan ulang juga 200 (bukan error)", b.status === 200, `status ${b.status}`);
  cek("mengembalikan transaksi yang SAMA", a.json?.id === b.json?.id,
    `${a.json?.id} vs ${b.json?.id}`);
  cek("nomor transaksi sama", a.json?.nomorTransaksi === b.json?.nomorTransaksi);

  const jumlah1 = await prisma.penjualan.count({ where: { idempotencyKey: k1 } });
  cek("hanya satu baris penjualan tersimpan", jumlah1 === 1, `dapat ${jumlah1}`);

  const stok1 = await prisma.barang.findUnique({ where: { id: barang.id } });
  cek("stok terpotong SEKALI (100 - 3 = 97)", stok1.stok === 97, `dapat ${stok1.stok}`);

  // ── 2. Dua percobaan nyaris bersamaan dengan kunci sama ──
  const k2 = kunci();
  const [c, d] = await Promise.all([jual(k2, 5), jual(k2, 5)]);
  cek("keduanya dijawab 200", c.status === 200 && d.status === 200,
    `${c.status} / ${d.status}`);
  cek("keduanya menunjuk transaksi yang sama", c.json?.id === d.json?.id,
    `${c.json?.id} vs ${d.json?.id}`);

  const jumlah2 = await prisma.penjualan.count({ where: { idempotencyKey: k2 } });
  cek("tetap satu baris penjualan", jumlah2 === 1, `dapat ${jumlah2}`);

  const stok2 = await prisma.barang.findUnique({ where: { id: barang.id } });
  cek("stok terpotong sekali (97 - 5 = 92)", stok2.stok === 92, `dapat ${stok2.stok}`);

  // ── 3. Transaksi tanpa kunci tetap jalan (kompatibilitas) ──
  const tanpaKunci = await api("/api/penjualan", {
    method: "POST",
    body: JSON.stringify({
      items: [{ id: barang.id, qty: 2 }],
      bayar: 100_000,
      metodeBayar: "Tunai",
    }),
  });
  cek("transaksi tanpa kunci tetap diterima", tanpaKunci.status === 200,
    `status ${tanpaKunci.status}`);

  // ── 4. Stok tidak boleh menjadi negatif ──
  await prisma.barang.update({ where: { id: barang.id }, data: { stok: 1 } });
  const rebutan = await Promise.all([
    jual(kunci(), 1),
    jual(kunci(), 1),
    jual(kunci(), 1),
  ]);
  const berhasil = rebutan.filter((r) => r.status === 200).length;
  cek("hanya satu dari tiga penjualan barang terakhir yang lolos", berhasil === 1,
    `berhasil ${berhasil} — status ${rebutan.map((r) => r.status).join(",")}`);

  const stokAkhir = await prisma.barang.findUnique({ where: { id: barang.id } });
  cek("stok tidak negatif", stokAkhir.stok === 0, `dapat ${stokAkhir.stok}`);

  // ── 5. Belanjaan besar tetap selesai ──
  await prisma.barang.update({ where: { id: barang.id }, data: { stok: 500 } });
  const banyak = await prisma.barang.findMany({ where: { aktif: true, stok: { gte: 5 } }, take: 12 });
  const besar = await api("/api/penjualan", {
    method: "POST",
    body: JSON.stringify({
      items: banyak.map((x) => ({ id: x.id, qty: 2 })),
      bayar: 100_000_000,
      metodeBayar: "Tunai",
      idempotencyKey: kunci(),
    }),
  });
  cek(`belanjaan ${banyak.length} item berhasil`, besar.status === 200,
    besar.teks.slice(0, 120));
  cek("semua baris detail tersimpan",
    (besar.json?.detail ?? []).length === banyak.length,
    `dapat ${(besar.json?.detail ?? []).length}`);
  cek("harga pokok ikut dibekukan di setiap baris",
    (besar.json?.detail ?? []).every((x) => typeof x.hargaBeli === "number"));

  console.log();
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
