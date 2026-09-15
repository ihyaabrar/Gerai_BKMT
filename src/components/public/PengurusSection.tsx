import { Users } from "lucide-react";
import { gambarLebar, LEBAR } from "@/lib/gambar";
import type { PengurusPublic } from "@/types/public-profile";
import { cn, sortPengurus } from "@/lib/utils";
import { LABEL_JENJANG, perluBagan, susunStruktur, type Struktur } from "@/lib/struktur-pengurus";

interface PengurusSectionProps {
  pengurusList: PengurusPublic[];
}

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

function KartuPengurus({
  p,
  warna,
  utama = false,
}: {
  p: PengurusPublic;
  warna: string;
  utama?: boolean;
}) {
  const ukuran = utama ? "w-20 h-20" : "w-16 h-16";
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

function BarisKartu({ daftar, warna, utama }: { daftar: PengurusPublic[]; warna: string; utama?: boolean }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {daftar.map((p) => (
        <KartuPengurus key={p.id} p={p} warna={warna} utama={utama} />
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

export function PengurusSection({ pengurusList }: PengurusSectionProps) {
  const sorted = sortPengurus(pengurusList);
  const grouped = sorted.reduce<Record<string, PengurusPublic[]>>((acc, p) => {
    if (!acc[p.tingkatan]) acc[p.tingkatan] = [];
    acc[p.tingkatan].push(p);
    return acc;
  }, {});

  return (
    <section id="pengurus" className="bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        <div className="max-w-xl mb-10">
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
          <div className="space-y-14">
            {["PD", "PC", "Permata"].map((tingkatan) => {
              const list = grouped[tingkatan];
              if (!list?.length) return null;
              const warna = TINGKATAN_WARNA[tingkatan];
              const struktur = susunStruktur(list);
              return (
                <div key={tingkatan}>
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-8">
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${warna}`}>
                      <Users className="h-[18px] w-[18px]" />
                    </span>
                    <h3 className="text-[15px] font-semibold text-slate-900">
                      {TINGKATAN_LABEL[tingkatan]}
                    </h3>
                    <span className="text-xs text-slate-400">{list.length} orang</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {perluBagan(struktur) ? (
                    <Bagan s={struktur} warna={warna} />
                  ) : (
                    <BarisKartu daftar={list} warna={warna} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
