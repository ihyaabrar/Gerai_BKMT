/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // Header keamanan dasar untuk seluruh halaman dan API.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Halaman kasir dan admin tidak boleh dibingkai situs lain
          // (clickjacking: tombol "Hapus" disembunyikan di bawah umpan).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Berkas unggahan tidak boleh ditebak ulang jenisnya oleh browser.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Alamat lengkap halaman internal tidak dikirim ke situs luar.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Kamera tetap diizinkan untuk pemindai barcode di halaman sendiri.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
