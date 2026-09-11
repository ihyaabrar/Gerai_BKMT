import { v2 as cloudinary } from "cloudinary";

// Validasi env variables saat module di-load
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.warn("⚠️  Cloudinary env variables tidak lengkap. Upload gambar tidak akan berfungsi.");
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

export { cloudinary };

export async function uploadImage(
  file: Buffer,
  folder: string,
): Promise<string> {
  // Konversi buffer ke base64 data URI — lebih reliable di Next.js App Router
  const base64 = file.toString("base64");
  const mimeType = detectMimeType(file);
  const dataUri = `data:${mimeType};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `bkmt/${folder}`,
    resource_type: "image",
    // Foto dari kamera HP berukuran 3000×4000 dan 2–4 MB. Tidak ada satu pun
    // tempat di aplikasi ini yang menampilkannya lebih besar dari ~1200 px,
    // jadi yang disimpan pun tidak perlu lebih besar dari itu. `limit` hanya
    // memperkecil, gambar yang sudah kecil dibiarkan apa adanya.
    transformation: [
      { width: 1200, height: 1200, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  return result.secure_url;
}

function detectMimeType(buffer: Buffer): string {
  // Deteksi MIME type dari magic bytes
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return "image/gif";
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return "image/webp";
  return "image/jpeg"; // default
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
