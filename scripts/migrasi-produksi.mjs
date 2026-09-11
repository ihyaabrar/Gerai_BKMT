/**
 * Menjalankan `prisma migrate deploy`, tetapi HANYA pada build produksi.
 *
 * Dipanggil dari skrip `vercel-build`.
 *
 * Kenapa perlu penjaga:
 *
 * `DATABASE_URL` di Vercel diisi untuk Production maupun Preview, dan
 * keduanya menunjuk database yang sama — organisasi ini tidak punya database
 * staging terpisah. Tanpa penjaga ini, setiap build preview dari sebuah pull
 * request akan menerapkan migrasinya ke database PRODUKSI, sebelum PR-nya
 * di-merge, bahkan bila PR itu akhirnya ditolak.
 *
 * Untuk aplikasi yang memegang uang anggota, perubahan skema harus terjadi
 * hanya lewat satu pintu: deploy ke produksi.
 *
 * Di luar Vercel (mis. build lokal) skrip ini tidak melakukan apa pun —
 * jalankan `npm run db:migrate` sendiri bila memang diinginkan.
 */
import { spawnSync } from "node:child_process";

const lingkungan = process.env.VERCEL_ENV; // "production" | "preview" | "development"

if (lingkungan !== "production") {
  console.log(
    `[migrasi] Dilewati — VERCEL_ENV=${lingkungan ?? "(kosong)"}. ` +
      "Migrasi hanya dijalankan pada build produksi."
  );
  process.exit(0);
}

console.log("[migrasi] Build produksi terdeteksi, menjalankan prisma migrate deploy...");

const hasil = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
});

// Build sengaja digagalkan bila migrasi gagal: lebih baik deploy berhenti
// daripada aplikasi naik dengan skema yang tidak cocok dengan kodenya.
process.exit(hasil.status ?? 1);
