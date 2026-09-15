"use client";

import { useMemo, useState } from "react";
import { MapPin, Users } from "lucide-react";
import { gambarLebar, LEBAR } from "@/lib/gambar";
import type { PengurusPublic } from "@/types/public-profile";
import { cn, sortPengurus } from "@/lib/utils";
import { LABEL_JENJANG, perluBagan, susunStruktur, type Struktur } from "@/lib/struktur-pengurus";

interface PengurusSectionProps {
  pengurusList: PengurusPublic[];
}

const TINGKATAN = ["PD", "PC", "Permata"] as const;

const TINGKATAN_LABEL: Record<string, string> = {
  PD: "Pimpinan Daerah",
  PC: "Pimpinan Cabang",
  Permata: "Permata BKMT",
};

// Warna aksen dibedakan tipis saja; pembeda utamanya tetap label tingkatan.
const TINGKATAN_WARNA: Record<string, string> = {
  PD: "bg-brand-50 text-brand-600",
  PC: "bg-sky-50 text-sky-600",
  Permata: "bg-gold-50 text-gold-600",
};

const TANPA_CABANG = "__tanpa_cabang__";

function KartuPengurus({
  p,
  warna,
  utama = false,
  tampilkanCabang = false,
}: {
  p: PengurusPublic;
  warna: string;
  utama?: boolean;
  tampilkanCabang?: boolean;
}) {
  const ukuran = utama ? "w-20 h-20" : "w-16 h-16";
  // Cabang tidak diulang bila sudah tertulis di jabatan ("… Kecamatan Kubu").
  const cabang =
    tampilkanCabang && p.wilayah && !p.jabatan.toLowerCase().includes(p.wilayah.toLowerCase())
      ? p.wilayah
      : null;
  return (
    <div
      className={cn(
        "rounded-card border bg-white p-3 sm:p-4 text-center transition-colors hover:border-brand-300",
        utama ? "w-48 sm:w-52 border-brand-300 shadow-card ring-4 ring-brand-50" : "w-[9.5rem] sm:w-44 border-border"
      )}
    >
      {p.fotoUrl ? (
        <img
          src={gambarLebar(p.fotoUrl, LEBAR.ikon)}
          alt={p.nama}
          loading="lazy"
          decoding="async"
          width={utama ? 80 : 64}
          height={utama ? 80 : 64}
          className={cn(ukuran, "rounded-full object-cover mx-auto")}
        />
      ) : (
        <div className={cn(ukuran, "rounded-full mx-auto flex items-center justify-center", warna)}>
          <span className={cn("font-bold", utama ? "text-2xl" : "text-xl")}>
            {p.nama.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <p
        className={cn(
          "mt-3 font-semibold text-slate-900 leading-snug line-clamp-2",
          utama ? "text-sm" : "text-[13px]"
        )}
      >
        {p.nama}
      </p>
      <p className="text-xs text-brand-600 font-medium mt-1">{p.jabatan}</p>
      {cabang && (
        <p className="text-[11px] text-slate-500 mt-0.5 inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {cabang}
        </p>
      )}
      {p.periode && <p className="text-[11px] text-slate-400 mt-0.5">{p.periode}</p>}
    </div>
  );
}

function LabelTingkat({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
      {children}
    </p>
  );
}

function BarisKartu({
  daftar,
  warna,
  utama,
  tampilkanCabang,
}: {
  daftar: PengurusPublic[];
  warna: string;
  utama?: boolean;
  tampilkanCabang?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {daftar.map((p) => (
        <KartuPengurus key={p.id} p={p} warna={warna} utama={utama} tampilkanCabang={tampilkanCabang} />
      ))}
    </div>
  );
}

const Garis = ({ putus = false }: { putus?: boolean }) => (
  <div
    aria-hidden="true"
    className={cn("mx-auto h-8 w-0 border-l", putus ? "border-dashed border-slate-300" : "border-slate-300")}
  />
);

/**
 * Bagan: Penasehat → Ketua → Wakil Ketua → Sekretaris | Bendahara → lainnya.
 * Penasehat dihubungkan dengan garis putus-putus karena perannya memberi
 * nasihat, bukan memimpin langsung.
 */
function Bagan({ s, warna }: { s: Struktur<PengurusPublic>; warna: string }) {
  const kolomTengah = [
    { judul: LABEL_JENJANG.sekretaris, daftar: s.sekretaris },
    { judul: LABEL_JENJANG.bendahara, daftar: s.bendahara },
  ].filter((k) => k.daftar.length > 0);

  return (
    <div>
      {s.penasehat.length > 0 && (
        <>
          <LabelTingkat>{LABEL_JENJANG.penasehat}</LabelTingkat>
          <BarisKartu daftar={s.penasehat} warna={warna} />
          <Garis putus />
        </>
      )}

      <LabelTingkat>{LABEL_JENJANG.ketua}</LabelTingkat>
      <BarisKartu daftar={s.ketua} warna={warna} utama />

      {s.wakil.length > 0 && (
        <>
          <Garis />
          <LabelTingkat>{LABEL_JENJANG.wakil}</LabelTingkat>
          <BarisKartu daftar={s.wakil} warna={warna} />
        </>
      )}

      {kolomTengah.length > 0 && (
        <>
          <Garis />
          <div className={cn("relative grid gap-8", kolomTengah.length === 2 && "sm:grid-cols-2")}>
            {kolomTengah.length === 2 && (
              <div aria-hidden="true" className="hidden sm:block absolute top-0 left-1/4 right-1/4 border-t border-slate-300" />
            )}
            {kolomTengah.map((k) => (
              <div key={k.judul} className="flex flex-col items-center">
                {kolomTengah.length === 2 && (
                  <div aria-hidden="true" className="hidden sm:block h-6 w-0 border-l border-slate-300" />
                )}
                <LabelTingkat>{k.judul}</LabelTingkat>
                <BarisKartu daftar={k.daftar} warna={warna} />
              </div>
            ))}
          </div>
        </>
      )}

      {s.lainnya.length > 0 && (
        <>
          <Garis />
          <LabelTingkat>{LABEL_JENJANG.lainnya}</LabelTingkat>
          <BarisKartu daftar={s.lainnya} warna={warna} />
        </>
      )}
    </div>
  );
}

/** Bagan bila jajarannya lengkap, kartu sejajar bila tidak. */
function Susunan({
  daftar,
  warna,
  tampilkanCabang,
}: {
  daftar: PengurusPublic[];
  warna: string;
  tampilkanCabang?: boolean;
}) {
  const s = susunStruktur(daftar);
  return perluBagan(s) ? (
    <Bagan s={s} warna={warna} />
  ) : (
    <BarisKartu daftar={daftar} warna={warna} tampilkanCabang={tampilkanCabang} />
  );
}

function Chip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        aktif
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-border bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"
      )}
    >
      {children}
    </button>
  );
}

export function PengurusSection({ pengurusList }: PengurusSectionProps) {
  const grouped = useMemo(() => {
    const hasil: Record<string, PengurusPublic[]> = {};
    for (const p of sortPengurus(pengurusList)) (hasil[p.tingkatan] ??= []).push(p);
    return hasil;
  }, [pengurusList]);

  const tersedia = TINGKATAN.filter((t) => grouped[t]?.length);
  const [tab, setTab] = useState<string>(tersedia[0] ?? "PD");
  const [cabang, setCabang] = useState<string>("semua");

  const list = useMemo(() => grouped[tab] ?? [], [grouped, tab]);
  const warna = TINGKATAN_WARNA[tab];

  // Cabang hanya berarti untuk Pimpinan Cabang & Permata.
  const daftarCabang = useMemo(() => {
    if (tab === "PD") return [];
    const nama: string[] = [];
    for (const p of list) {
      const k = p.wilayah?.trim() || TANPA_CABANG;
      if (!nama.includes(k)) nama.push(k);
    }
    return nama.some((k) => k !== TANPA_CABANG) ? nama : [];
  }, [list, tab]);

  const pilihTab = (t: string) => {
    setTab(t);
    setCabang("semua");
  };

  const perCabang = (k: string) => list.filter((p) => (p.wilayah?.trim() || TANPA_CABANG) === k);

  // "Semua cabang" dibuat ringkas: satu kartu per cabang (ketuanya), bukan
  // seluruh susunan setiap cabang berurutan ke bawah.
  const wakilCabang = (k: string) => {
    const anggota = perCabang(k);
    const s = susunStruktur(anggota);
    return { orang: s.ketua[0] ?? anggota[0], jumlah: anggota.length };
  };

  return (
    <section id="pengurus" className="bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        <div className="max-w-xl mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
            Struktur
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Susunan Pengurus
          </h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Kepengurusan PD BKMT Kabupaten Kubu Raya yang berkomitmen melayani umat.
          </p>
        </div>

        {pengurusList.length === 0 ? (
          <div className="rounded-card border border-border bg-surface-muted text-center py-16">
            <div className="w-14 h-14 bg-white border border-border rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Data pengurus sedang dipersiapkan</p>
          </div>
        ) : (
          <>
            {/* Menu tingkatan */}
            <div
              role="tablist"
              aria-label="Tingkatan pengurus"
              className="flex gap-1 border-b border-border overflow-x-auto overflow-y-hidden"
            >
              {tersedia.map((t) => (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={tab === t}
                  onClick={() => pilihTab(t)}
                  className={cn(
                    "shrink-0 whitespace-nowrap -mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                    tab === t
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  {TINGKATAN_LABEL[t]}
                  <span className={cn("ml-1.5 text-xs font-medium", tab === t ? "text-brand-500" : "text-slate-400")}>
                    {grouped[t].length}
                  </span>
                </button>
              ))}
            </div>

            {/* Pilihan cabang */}
            {daftarCabang.length > 0 && (
              <div className="mt-5 -mx-6 px-6 flex gap-2 overflow-x-auto pb-1" aria-label="Pilih cabang">
                <Chip aktif={cabang === "semua"} onClick={() => setCabang("semua")}>
                  Semua cabang
                </Chip>
                {daftarCabang.map((k) => (
                  <Chip key={k} aktif={cabang === k} onClick={() => setCabang(k)}>
                    {k === TANPA_CABANG ? "Lainnya" : k}
                  </Chip>
                ))}
              </div>
            )}

            <div role="tabpanel" className="mt-8">
              {daftarCabang.length === 0 ? (
                <Susunan daftar={list} warna={warna} />
              ) : cabang !== "semua" ? (
                <Susunan daftar={perCabang(cabang)} warna={warna} />
              ) : (
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  {daftarCabang.map((k) => {
                    const { orang, jumlah } = wakilCabang(k);
                    return (
                      <div key={k} className="flex flex-col items-center">
                        <KartuPengurus p={orang} warna={warna} tampilkanCabang />
                        {jumlah > 1 && (
                          <button
                            type="button"
                            onClick={() => setCabang(k)}
                            className="mt-2 text-xs font-medium text-brand-700 hover:underline"
                          >
                            Lihat susunan ({jumlah} orang)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
