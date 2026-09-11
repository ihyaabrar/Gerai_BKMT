#!/bin/bash
#
# Smoke test kontrol akses Gerai BKMT.
#
# Menjalankan aplikasi lebih dulu (npm run build && npm run start),
# lalu: bash scripts/smoke-test.sh [base-url]
#
# Membutuhkan akun seed `admin` dan `kasir`.
set -u
B="${1:-http://localhost:3000}"
pass=0; fail=0
chk() { # name expected actual
  if [ "$2" = "$3" ]; then printf "  PASS  %-48s %s\n" "$1" "$3"; pass=$((pass+1));
  else printf "  FAIL  %-48s expected %s got %s\n" "$1" "$2" "$3"; fail=$((fail+1)); fi
}
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

COOKIE_DIR=$(mktemp -d)
trap 'rm -rf "$COOKIE_DIR"' EXIT
a_txt="$COOKIE_DIR/admin.txt"
k_txt="$COOKIE_DIR/kasir.txt"

curl -s -c "$a_txt" -X POST $B/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' >/dev/null
curl -s -c "$k_txt" -X POST $B/api/auth/login -H "Content-Type: application/json" -d '{"username":"kasir","password":"kasir123"}' >/dev/null

echo "[Tanpa login]"
for ep in /api/barang /api/penjualan /api/dashboard /api/laporan /api/backup /api/pengaturan /api/shift /api/member /api/supplier /api/nasabah /api/retur /api/penyesuaian /api/pengeluaran /api/barang-masuk /api/kategori-barang /api/user /api/distribusi; do
  chk "401 $ep" 401 "$(code $B$ep)"
done
chk "401 /api/admin/galeri" 401 "$(code $B/api/admin/galeri)"
chk "401 /api/admin/agenda" 401 "$(code $B/api/admin/agenda)"
chk "401 cookie sesi dipalsukan" 401 "$(code -H 'Cookie: session={\"id\":\"x\",\"role\":\"master\"}' $B/api/barang)"
chk "401 tanda tangan diubah" 401 "$(code -H 'Cookie: session=eyJhIjoxfQ.aaaa' $B/api/barang)"

echo "[Publik tetap terbuka]"
for ep in / /login /api/public/profil /api/public/berita /api/public/pengurus /api/public/gerai /api/public/galeri /api/public/agenda; do
  chk "200 $ep" 200 "$(code $B$ep)"
done

echo "[Role kasir]"
for ep in /api/laporan /api/nasabah /api/backup /api/user /api/admin/galeri /api/admin/agenda; do chk "403 kasir $ep" 403 "$(code -b "$k_txt" $B$ep)"; done
chk "403 kasir buat pengguna" 403 "$(code -b "$k_txt" -X POST $B/api/user -H 'Content-Type: application/json' -d '{}')"
chk "307 kasir buka /app/sistem/pengguna" 307 "$(code -b "$k_txt" $B/app/sistem/pengguna)"
chk "200 kasir ganti password sendiri" 400 "$(code -b "$k_txt" -X POST $B/api/auth/password -H 'Content-Type: application/json' -d '{}')"
for ep in /api/barang /api/pengaturan /api/member /api/shift; do chk "200 kasir $ep" 200 "$(code -b "$k_txt" $B$ep)"; done
chk "403 kasir ubah pengaturan" 403 "$(code -b "$k_txt" -X POST $B/api/pengaturan -H 'Content-Type: application/json' -d '{}')"
chk "403 kasir hapus barang" 403 "$(code -b "$k_txt" -X DELETE "$B/api/barang?id=x")"
chk "403 kasir buat barang" 403 "$(code -b "$k_txt" -X POST $B/api/barang -H 'Content-Type: application/json' -d '{}')"
chk "403 kasir ubah harga barang" 403 "$(code -b "$k_txt" -X PATCH $B/api/barang -H 'Content-Type: application/json' -d '{}')"
chk "400 kasir daftarkan barang baru lewat barang-masuk" 400 "$(code -b "$k_txt" -X POST $B/api/barang-masuk -H 'Content-Type: application/json' -d '{"mode":"baru"}')"
chk "400 kasir ubah harga beli lewat barang-masuk" 400 "$(code -b "$k_txt" -X POST $B/api/barang-masuk -H 'Content-Type: application/json' -d '{"mode":"existing","barangId":"x","qty":1,"updateHargaBeli":true,"hargaBeliBaru":1}')"
chk "403 kasir /api/distribusi" 403 "$(code -b "$k_txt" $B/api/distribusi)"
chk "307 kasir buka /app/keuangan/distribusi" 307 "$(code -b "$k_txt" $B/app/keuangan/distribusi)"
chk "400 body JSON rusak" 400 "$(code -b "$a_txt" -X POST $B/api/pengeluaran -H 'Content-Type: application/json' -d 'bukan-json')"

echo "[Pencabutan sesi]"
# Cookie kasir masih sah secara kriptografis selama 12 jam. Menonaktifkan
# akunnya harus langsung mencabut akses, bukan menunggu cookie kedaluwarsa.
kasir_id="$(curl -s -b "$k_txt" $B/api/auth/me | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)"
if [ -n "$kasir_id" ]; then
  curl -s -b "$a_txt" -X PATCH $B/api/user -H 'Content-Type: application/json'     -d "{\"id\":\"$kasir_id\",\"aktif\":false}" > /dev/null
  chk "401 kasir nonaktif ditolak" 401 "$(code -b "$k_txt" $B/api/barang)"
  chk "401 /api/auth/me ikut menolak" 401 "$(code -b "$k_txt" $B/api/auth/me)"
  curl -s -b "$a_txt" -X PATCH $B/api/user -H 'Content-Type: application/json'     -d "{\"id\":\"$kasir_id\",\"aktif\":true}" > /dev/null
  chk "200 kasir aktif kembali" 200 "$(code -b "$k_txt" $B/api/barang)"
else
  echo "  (id kasir tidak terbaca — lewati uji pencabutan sesi)"
fi
chk "307 kasir buka /admin" 307 "$(code -b "$k_txt" $B/admin)"
chk "307 kasir buka /app/keuangan/laporan" 307 "$(code -b "$k_txt" $B/app/keuangan/laporan)"

echo "[Role admin]"
for ep in /api/laporan /api/nasabah /api/backup /api/barang /api/user /api/distribusi /api/admin/galeri /api/admin/agenda; do chk "200 admin $ep" 200 "$(code -b "$a_txt" $B$ep)"; done
chk "200 admin buka /admin" 200 "$(code -b "$a_txt" $B/admin)"

echo "[Redirect halaman tanpa login]"
for p in /app /app/kasir /admin; do chk "307 $p" 307 "$(code $B$p)"; done

echo
echo "  Total: $pass lulus, $fail gagal"
[ $fail -eq 0 ]
