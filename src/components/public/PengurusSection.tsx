import { Users } from "lucide-react";
import type { PengurusPublic } from "@/types/public-profile";
import { sortPengurus } from "@/lib/utils";

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
          <div className="space-y-10">
            {["PD", "PC", "Permata"].map((tingkatan) => {
              const list = grouped[tingkatan];
              if (!list?.length) return null;
              return (
                <div key={tingkatan}>
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-6">
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TINGKATAN_WARNA[tingkatan]}`}
                    >
                      <Users className="h-[18px] w-[18px]" />
                    </span>
                    <h3 className="text-[15px] font-semibold text-slate-900">
                      {TINGKATAN_LABEL[tingkatan]}
                    </h3>
                    <span className="text-xs text-slate-400">{list.length} orang</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Grid pengurus */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {list.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-card border border-border bg-white p-4 text-center transition-colors hover:border-brand-300"
                      >
                        {p.fotoUrl ? (
                          <img
                            src={p.fotoUrl}
                            alt={p.nama}
                            className="w-16 h-16 rounded-full object-cover mx-auto"
                          />
                        ) : (
                          <div
                            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${TINGKATAN_WARNA[tingkatan]}`}
                          >
                            <span className="text-xl font-bold">
                              {p.nama.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <p className="mt-3 font-semibold text-slate-900 text-[13px] leading-snug line-clamp-2">
                          {p.nama}
                        </p>
                        <p className="text-xs text-brand-600 font-medium mt-1">
                          {p.jabatan}
                        </p>
                        {p.periode && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{p.periode}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
