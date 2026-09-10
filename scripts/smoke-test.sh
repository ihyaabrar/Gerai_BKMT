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
for ep in /api/barang /api/penjualan /api/dashboard /api/laporan /api/backup /api/pengaturan /api/shift /api/member /api/supplier /api/nasabah /api/retur /api/penyesuaian /api/pengeluaran /api/barang-masuk /api/kategori-barang; do
  chk "401 $ep" 401 "$(code $B$ep)"
done
chk "401 cookie sesi dipalsukan" 401 "$(code -H 'Cookie: session={\"id\":\"x\",\"role\":\"master\"}' $B/api/barang)"
chk "401 tanda tangan diubah" 401 "$(code -H 'Cookie: session=eyJhIjoxfQ.aaaa' $B/api/barang)"

echo "[Publik tetap terbuka]"
for ep in / /login /api/public/profil /api/public/berita /api/public/pengurus /api/public/gerai; do
  chk "200 $ep" 200 "$(code $B$ep)"
done

echo "[Role kasir]"
for ep in /api/laporan /api/nasabah /api/backup; do chk "403 kasir $ep" 403 "$(code -b "$k_txt" $B$ep)"; done
for ep in /api/barang /api/pengaturan /api/member /api/shift; do chk "200 kasir $ep" 200 "$(code -b "$k_txt" $B$ep)"; done
chk "403 kasir ubah pengaturan" 403 "$(code -b "$k_txt" -X POST $B/api/pengaturan -H 'Content-Type: application/json' -d '{}')"
chk "403 kasir hapus barang" 403 "$(code -b "$k_txt" -X DELETE "$B/api/barang?id=x")"
chk "307 kasir buka /admin" 307 "$(code -b "$k_txt" $B/admin)"
chk "307 kasir buka /app/keuangan/laporan" 307 "$(code -b "$k_txt" $B/app/keuangan/laporan)"

echo "[Role admin]"
for ep in /api/laporan /api/nasabah /api/backup /api/barang; do chk "200 admin $ep" 200 "$(code -b "$a_txt" $B$ep)"; done
chk "200 admin buka /admin" 200 "$(code -b "$a_txt" $B/admin)"

echo "[Redirect halaman tanpa login]"
for p in /app /app/kasir /admin; do chk "307 $p" 307 "$(code $B$p)"; done

echo
echo "  Total: $pass lulus, $fail gagal"
[ $fail -eq 0 ]
