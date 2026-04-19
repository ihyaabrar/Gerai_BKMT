export interface ProfilOrganisasiPublic {
  id: string;
  nama: string;
  singkatan?: string | null;
  deskripsi?: string | null;
  visi?: string | null;
  misi?: string | null;
  sejarah?: string | null;
  logoUrl?: string | null;
  email?: string | null;
  telepon?: string | null;
  alamat?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  website?: string | null;
}

export interface BeritaPublic {
  id: string;
  judul: string;
  slug: string;
  ringkasan?: string | null;
  gambarUrl?: string | null;
  tanggalPublikasi?: string | Date | null;
  penulis?: { nama: string } | null;
}

export interface BeritaDetailPublic extends BeritaPublic {
  konten: string;
}

export interface PengurusPublic {
  id: string;
  nama: string;
  jabatan: string;
  tingkatan: "PD" | "PC" | "Permata";
  periode?: string | null;
  fotoUrl?: string | null;
  urutan: number;
  nik?: string | null;
  alamat?: string | null;
}

export interface InformasiGeraiPublic {
  id: string;
  nama: string;
  alamat: string;
  jamOperasional?: string | null;
  telepon?: string | null;
  deskripsi?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
