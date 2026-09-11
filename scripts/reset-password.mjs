/**
 * Menyetel ulang password satu akun langsung di database.
 *
 * Dipakai ketika tidak ada seorang pun yang bisa masuk — master lupa
 * passwordnya, atau akun awal terlanjur dibuat tanpa password yang tercatat.
 * Tanpa alat ini, satu-satunya jalan keluar adalah mengutak-atik database
 * secara manual.
 *
 * Username dan password dibaca dari stdin, satu per baris. Penyembunyian
 * ketikan diserahkan ke shell (`read -s`) karena cara itu andal di semua
 * terminal — mencoba menyembunyikannya dari dalam Node justru membuat
 * pembacaan input tidak bisa diandalkan.
 *
 * Jalankan (password tidak tampil di layar dan tidak masuk riwayat shell):
 *
 *   read -s -p "Password baru: " P && echo && \
 *   printf 'admin\n%s\n' "$P" | DATABASE_URL="<connection-string>" \
 *   node scripts/reset-password.mjs
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const MIN_PANJANG = 8;

async function bacaStdin() {
  const potongan = [];
  for await (const bagian of process.stdin) potongan.push(bagian);
  return Buffer.concat(potongan).toString("utf8");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL belum diatur. Lihat contoh perintah di bagian atas berkas ini."
    );
  }

  const baris = (await bacaStdin()).split(/\r?\n/);
  const username = (baris[0] ?? "").trim();
  const password = baris[1] ?? "";

  if (!username) throw new Error("Username tidak diisi (baris pertama stdin).");
  if (password.length < MIN_PANJANG) {
    throw new Error(`Password minimal ${MIN_PANJANG} karakter.`);
  }

  const prisma = new PrismaClient();

  try {
    // Neon paket gratis menidurkan compute saat menganggur; koneksi pertama
    // sering perlu beberapa detik untuk membangunkannya.
    for (let i = 1; i <= 6; i++) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        break;
      } catch (e) {
        if (i === 6) throw e;
        await new Promise((r) => setTimeout(r, 2500));
      }
    }

    const target = await prisma.user.findUnique({
      where: { username },
      select: { nama: true, role: true, aktif: true },
    });

    if (!target) {
      const ada = await prisma.user.findMany({ select: { username: true } });
      throw new Error(
        `Akun "${username}" tidak ada. Yang tersedia: ${ada.map((a) => a.username).join(", ")}`
      );
    }

    await prisma.user.update({
      where: { username },
      data: { password: await bcrypt.hash(password, 12) },
    });

    console.log(
      `\n✅ Password "${username}" (${target.role} — ${target.nama}) berhasil disetel ulang.` +
        (target.aktif ? "" : "\n⚠️  Akun ini berstatus NONAKTIF, jadi belum bisa dipakai login.") +
        "\n"
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("\n❌ " + e.message + "\n");
  process.exitCode = 1;
});
